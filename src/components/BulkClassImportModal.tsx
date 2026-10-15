import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BranchClass } from '../types';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  GraduationCap,
  Check
} from 'lucide-react';

interface BulkClassImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedClassRow {
  code: string;
  name: string;
  facultyCode: string;
  academicYear: string;
  computedStudentCount: number;
  isValid: boolean;
  isDuplicate: boolean;
  errorMessage?: string;
}

export const BulkClassImportModal: React.FC<BulkClassImportModalProps> = ({ isOpen, onClose }) => {
  const { branchClasses, batchAddBranchClasses, organizations, students, user, showToast } = useApp();

  const currentLevel = user.currentRole.roleLevel;
  const userFaculty = user.currentRole.orgCode || 'CNTT';

  const [parsedRows, setParsedRows] = useState<ParsedClassRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // Download official Excel .xlsx template without "Số sinh viên" (tự động tính dựa vào số sinh viên được upload lên phần mềm)
  const handleDownloadTemplate = () => {
    const headers = [
      'Mã Chi Đoàn',
      'Tên Đầy Đủ Chi Đoàn',
      'Mã Khoa (VD: CNTT, CNTY, KT, KHSH...)',
      'Niên Khóa (VD: 2024-2028)'
    ];

    const sampleRows = [
      ['DH24IT02', 'Chi đoàn DH24IT02 (K24 CNTT 2)', currentLevel === 3 ? userFaculty : 'CNTT', '2024-2028'],
      ['DH24IT03', 'Chi đoàn DH24IT03 (K24 CNTT 3)', currentLevel === 3 ? userFaculty : 'CNTT', '2024-2028'],
      ['DH24TY01', 'Chi đoàn DH24TY01 (K24 Thú Y 1)', currentLevel === 3 ? userFaculty : 'CNTY', '2024-2029'],
    ];

    const wsData = [headers, ...sampleRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    ws['!cols'] = [
      { wch: 15 },
      { wch: 35 },
      { wch: 20 },
      { wch: 15 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mau_Them_ChiDoan');
    XLSX.writeFile(wb, 'Mau_Them_ChiDoan_NLU_2026.xlsx');
    showToast('Đã tải xuống file Excel mẫu (.xlsx) thành công!', 'success');
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      showToast('Hệ thống chỉ chấp nhận tệp định dạng Excel (.xlsx). Vui lòng chọn tệp .xlsx!', 'error');
      e.target.value = '';
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rawData.length < 2) {
          showToast('Tệp không chứa dữ liệu hợp lệ!', 'error');
          setIsProcessing(false);
          return;
        }

        const existingCodes = new Set(branchClasses.map(c => c.code.toUpperCase()));
        const seenInFile = new Set<string>();
        const rows: ParsedClassRow[] = [];

        for (let i = 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length === 0 || !row[0]) continue;

          const code = String(row[0] || '').trim().toUpperCase();
          const name = String(row[1] || '').trim();
          let facultyCode = String(row[2] || '').trim().toUpperCase();
          const academicYear = String(row[3] || '2024-2028').trim();

          // If Level 3 (Khoa), restrict Chi đoàn to user's faculty
          if (currentLevel === 3) {
            facultyCode = userFaculty;
          } else if (!facultyCode) {
            facultyCode = 'CNTT';
          }

          // Tự động tính số sinh viên dựa vào số sinh viên được upload lên phần mềm
          const computedCount = students.filter(s => s.classCode === code).length;

          let isValid = true;
          let isDuplicate = false;
          let errorMessage = '';

          if (!code || !name) {
            isValid = false;
            errorMessage = 'Thiếu mã hoặc tên chi đoàn';
          } else if (existingCodes.has(code) || seenInFile.has(code)) {
            isDuplicate = true;
            isValid = false;
            errorMessage = `Mã chi đoàn [${code}] đã tồn tại`;
          }

          seenInFile.add(code);

          rows.push({
            code,
            name,
            facultyCode,
            academicYear,
            computedStudentCount: computedCount,
            isValid,
            isDuplicate,
            errorMessage,
          });
        }

        setParsedRows(rows);
        setIsProcessing(false);
      } catch (err) {
        console.error(err);
        showToast('Lỗi khi đọc file Excel/CSV. Vui lòng kiểm tra định dạng.', 'error');
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      showToast('Không có chi đoàn nào hợp lệ để thêm!', 'error');
      return;
    }

    const classesToCreate: Omit<BranchClass, 'id'>[] = validRows.map(r => ({
      code: r.code,
      name: r.name,
      facultyCode: r.facultyCode,
      academicYear: r.academicYear,
      // Tự động tính dựa vào số sinh viên được upload lên phần mềm
      studentCount: r.computedStudentCount,
    }));

    const count = batchAddBranchClasses(classesToCreate);
    if (count > 0) {
      onClose();
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const duplicateCount = parsedRows.filter(r => r.isDuplicate).length;
  const errorCount = parsedRows.filter(r => !r.isValid && !r.isDuplicate).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-emerald-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-300" />
            <h3 className="font-bold text-sm sm:text-base">
              Thêm Chi Đoàn Hàng Loạt Bằng File Excel / CSV
            </h3>
          </div>
          <button onClick={onClose} className="text-emerald-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Download Template Bar */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-emerald-900 text-xs">Bước 1: Tải file mẫu thêm Chi đoàn</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Cột bao gồm: Mã Chi đoàn, Tên Chi đoàn, Mã Khoa, Niên khóa. <span className="font-bold underline">(Đã bỏ cột Số sinh viên - hệ thống tự động tính từ hồ sơ sinh viên đã upload)</span>.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shrink-0 shadow-xs transition"
            >
              <Download className="w-4 h-4" />
              Tải File Excel Mẫu
            </button>
          </div>

          {/* Upload Area */}
          <div>
            <p className="font-bold text-slate-800 mb-2">Bước 2: Chọn tệp Excel danh sách chi đoàn (.xlsx)</p>
            <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-emerald-50/20 transition">
              <Upload className="w-8 h-8 text-emerald-600 mb-2" />
              <span className="font-bold text-slate-800 text-xs">
                {fileName ? fileName : 'Bấm vào đây để chọn tệp .xlsx'}
              </span>
              <span className="text-[11px] text-slate-400 mt-1">Hỗ trợ duy nhất định dạng Excel (.xlsx) - Tối đa 500 chi đoàn / lần</span>
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Parsing Results Summary */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  Xem trước danh sách chi đoàn ({parsedRows.length} dòng):
                </span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    ✓ {validCount} hợp lệ
                  </span>
                  {duplicateCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                      ⚠ {duplicateCount} trùng mã
                    </span>
                  )}
                  {errorCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                      ✕ {errorCount} lỗi
                    </span>
                  )}
                </div>
              </div>

              {/* Table Preview */}
              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-500 sticky top-0">
                    <tr>
                      <th className="px-3 py-2">STT</th>
                      <th className="px-3 py-2">Mã Chi Đoàn</th>
                      <th className="px-3 py-2">Tên Đầy Đủ</th>
                      <th className="px-3 py-2">Khoa</th>
                      <th className="px-3 py-2">Niên Khóa</th>
                      <th className="px-3 py-2 text-center">Số SV (Tự động tính)</th>
                      <th className="px-3 py-2">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r, idx) => (
                      <tr key={idx} className={!r.isValid ? 'bg-rose-50/40' : 'hover:bg-slate-50'}>
                        <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                        <td className="px-3 py-2 font-mono font-bold text-slate-900">{r.code}</td>
                        <td className="px-3 py-2 font-medium text-slate-800">{r.name}</td>
                        <td className="px-3 py-2 font-bold text-emerald-800">{r.facultyCode}</td>
                        <td className="px-3 py-2">{r.academicYear}</td>
                        <td className="px-3 py-2 text-center font-bold text-slate-700">
                          {r.computedStudentCount} SV
                        </td>
                        <td className="px-3 py-2">
                          {r.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Hợp lệ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700" title={r.errorMessage}>
                              <XCircle className="w-3.5 h-3.5 text-rose-600" /> {r.errorMessage || 'Lỗi'}
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

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              disabled={validCount === 0 || isProcessing}
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition"
            >
              <Check className="w-4 h-4" />
              Thêm {validCount} Chi Đoàn Vào Hệ Thống
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
