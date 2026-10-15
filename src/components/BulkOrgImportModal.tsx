import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Organization, OrgType, HostLevel } from '../types';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Building2,
  Check
} from 'lucide-react';

interface BulkOrgImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedOrgRow {
  code: string;
  name: string;
  type: OrgType;
  hostLevel: HostLevel;
  hostLevelName: string;
  hostLevelScorePoint: number;
  facultyCode?: string;
  email1: string;
  email2?: string;
  isValid: boolean;
  isDuplicate: boolean;
  errorMessage?: string;
}

export const BulkOrgImportModal: React.FC<BulkOrgImportModalProps> = ({ isOpen, onClose }) => {
  const { organizations, batchAddOrganizations, showToast } = useApp();

  const [parsedRows, setParsedRows] = useState<ParsedOrgRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // Download official Excel .xlsx template
  const handleDownloadTemplate = () => {
    const headers = [
      'Mã Đơn Vị (Viết tắt)',
      'Tên Đơn Vị',
      'Loại Đơn Vị (KHOA / CLB_TRUONG / CLB_KHOA)',
      'Cấp Đăng Cai (A / B)',
      'Điểm Cấp Đăng Cai (1-6)',
      'Email Liên Hệ 1',
      'Email Liên Hệ 2',
      'Thuộc Khoa (Mã Khoa cho CLB_KHOA)'
    ];

    const sampleRows = [
      ['CLB_ROBOT', 'CLB Nghiên Cứu Robot & Tự Động Hóa', 'CLB_TRUONG', 'B', '2', 'robotics@hcmuaf.edu.vn', '', ''],
      ['DOI_CTXH', 'Đội Công Tác Xã Hội NLU', 'CLB_TRUONG', 'B', '2', 'ctxh@hcmuaf.edu.vn', '', ''],
      ['K_CNTP', 'Khoa Công Nghệ Thực Phẩm', 'KHOA', 'B', '3', 'doankhoacntp@hcmuaf.edu.vn', '', ''],
      ['CLB_AI_CNTT', 'CLB AI Khoa CNTT', 'CLB_KHOA', 'B', '1', 'ai.cntt@hcmuaf.edu.vn', '', 'CNTT'],
    ];

    const wsData = [headers, ...sampleRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    ws['!cols'] = [
      { wch: 18 },
      { wch: 35 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
      { wch: 25 },
      { wch: 15 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mau_Them_DonVi');
    XLSX.writeFile(wb, 'Mau_Them_DonVi_NLU_2026.xlsx');
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

        const existingCodes = new Set(organizations.map(o => o.code.toUpperCase()));
        const seenInFile = new Set<string>();
        const rows: ParsedOrgRow[] = [];

        for (let i = 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length === 0 || !row[0]) continue;

          const code = String(row[0] || '').trim().toUpperCase();
          const name = String(row[1] || '').trim();
          const rawType = String(row[2] || '').trim().toUpperCase();
          const rawLevel = String(row[3] || 'B').trim().toUpperCase();
          const points = Number(row[4]) || 2;
          const email1 = String(row[5] || '').trim();
          const email2 = String(row[6] || '').trim();
          const facultyCode = String(row[7] || '').trim().toUpperCase();

          let type: OrgType = 'CLB_TRUONG';
          if (rawType.includes('KHOA') || rawType === 'KHOA') type = 'KHOA';
          else if (rawType.includes('CLB_KHOA')) type = 'CLB_KHOA';
          else if (rawType.includes('TRUONG') && !rawType.includes('CLB')) type = 'TRUONG';

          const hostLevel: HostLevel = rawLevel === 'A' ? 'A' : 'B';
          const hostLevelName =
            type === 'KHOA'
              ? 'Khoa và tương đương'
              : hostLevel === 'A'
              ? 'Đoàn, Hội trường và tương đương'
              : 'Ban, CLB, Đội, Nhóm cấp Trường';

          let isValid = true;
          let isDuplicate = false;
          let errorMessage = '';

          if (!code || !name) {
            isValid = false;
            errorMessage = 'Thiếu mã đơn vị hoặc tên đơn vị';
          } else if (existingCodes.has(code) || seenInFile.has(code)) {
            isDuplicate = true;
            isValid = false;
            errorMessage = `Mã đơn vị [${code}] đã tồn tại`;
          }

          seenInFile.add(code);

          rows.push({
            code,
            name,
            type,
            hostLevel,
            hostLevelName,
            hostLevelScorePoint: points,
            facultyCode: facultyCode || undefined,
            email1: email1 || `${code.toLowerCase()}@hcmuaf.edu.vn`,
            email2: email2 || undefined,
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
      showToast('Không có đơn vị nào hợp lệ để nhập!', 'error');
      return;
    }

    const orgsToCreate: Organization[] = validRows.map((r, idx) => ({
      id: organizations.length + idx + 1,
      code: r.code,
      name: r.name,
      type: r.type,
      hostLevel: r.hostLevel,
      hostLevelName: r.hostLevelName,
      hostLevelScorePoint: r.hostLevelScorePoint,
      email1: r.email1,
      email2: r.email2,
      facultyCode: r.facultyCode,
      parentCode: r.facultyCode,
      activityCount: 0,
    }));

    const count = batchAddOrganizations(orgsToCreate);
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
            <Building2 className="w-5 h-5 text-emerald-300" />
            <h3 className="font-bold text-sm sm:text-base">
              Thêm Đơn Vị Hàng Loạt Bằng File Excel / CSV
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
              <p className="font-bold text-emerald-900 text-xs">Bước 1: Tải file mẫu cấu trúc chuẩn</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                File mẫu bao gồm: Mã đơn vị, Tên đơn vị, Loại đơn vị (Khoa/CLB), Cấp đăng cai, Điểm đăng cai, Email.
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
            <p className="font-bold text-slate-800 mb-2">Bước 2: Chọn tệp Excel danh sách đơn vị (.xlsx)</p>
            <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-emerald-50/20 transition">
              <Upload className="w-8 h-8 text-emerald-600 mb-2" />
              <span className="font-bold text-slate-800 text-xs">
                {fileName ? fileName : 'Bấm vào đây để chọn tệp .xlsx'}
              </span>
              <span className="text-[11px] text-slate-400 mt-1">Hỗ trợ duy nhất định dạng Excel (.xlsx) - Tối đa 500 đơn vị / lần</span>
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
                  Xem trước dữ liệu ({parsedRows.length} dòng):
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
                      <th className="px-3 py-2">Mã Đơn Vị</th>
                      <th className="px-3 py-2">Tên Đơn Vị</th>
                      <th className="px-3 py-2">Loại</th>
                      <th className="px-3 py-2">Cấp ĐC</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r, idx) => (
                      <tr key={idx} className={!r.isValid ? 'bg-rose-50/40' : 'hover:bg-slate-50'}>
                        <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                        <td className="px-3 py-2 font-mono font-bold text-slate-900">{r.code}</td>
                        <td className="px-3 py-2 font-medium text-slate-800">{r.name}</td>
                        <td className="px-3 py-2">{r.type}</td>
                        <td className="px-3 py-2 text-center font-bold">{r.hostLevel} ({r.hostLevelScorePoint}đ)</td>
                        <td className="px-3 py-2 text-slate-500 font-mono text-[10px]">{r.email1}</td>
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
              Thêm {validCount} Đơn Vị Vào Hệ Thống
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
