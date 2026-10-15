import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SystemUserAccount, RoleLevel } from '../types';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Key,
  Shield,
  Check
} from 'lucide-react';

interface BulkAccountImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedAccountRow {
  email: string;
  fullName: string;
  roleLevel: RoleLevel;
  orgCode: string;
  orgName: string;
  classCode?: string;
  isValid: boolean;
  isDuplicate: boolean;
  errorMessage?: string;
}

export const BulkAccountImportModal: React.FC<BulkAccountImportModalProps> = ({ isOpen, onClose }) => {
  const { accounts, batchAddAccounts, organizations, branchClasses, showToast } = useApp();

  const [parsedRows, setParsedRows] = useState<ParsedAccountRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // Download official Excel .xlsx template
  const handleDownloadTemplate = () => {
    const headers = [
      'Email (Tài khoản HCMUAF)',
      'Họ và Tên Cán Bộ / Đơn Vị',
      'Cấp Quyền (4: Trường, 3: Khoa, 2: Chi đoàn/CLB)',
      'Mã Đơn Vị (VD: CNTT, CNTY, CLB_BAS, TRUONG)',
      'Tên Đơn Vị',
      'Mã Chi Đoàn (Bắt buộc nếu Cấp 2, VD: DH24IT01)'
    ];

    const sampleRows = [
      ['doankhoacntp@hcmuaf.edu.vn', 'BCH Đoàn Khoa Công nghệ Thực phẩm', '3', 'K_CNTP', 'Khoa Công nghệ Thực phẩm', ''],
      ['chidoan.dh24it02@hcmuaf.edu.vn', 'BCH Chi đoàn DH24IT02', '2', 'CNTT', 'Khoa Công nghệ Thông tin', 'DH24IT02'],
      ['clb.robotics@hcmuaf.edu.vn', 'Ban Chủ nhiệm CLB Robotics', '2', 'CLB_ROBOT', 'CLB Nghiên Cứu Robot & Tự Động Hóa', ''],
      ['phobithu.doantruong@hcmuaf.edu.vn', 'Phó Bí thư Đoàn Trường NLU', '4', 'TRUONG', 'Đoàn - Hội Trường ĐH Nông Lâm', ''],
    ];

    const wsData = [headers, ...sampleRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    ws['!cols'] = [
      { wch: 30 },
      { wch: 35 },
      { wch: 15 },
      { wch: 18 },
      { wch: 30 },
      { wch: 15 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mau_Cap_TaiKhoan');
    XLSX.writeFile(wb, 'Mau_Cap_TaiKhoan_HangLoat_NLU_2026.xlsx');
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

        const existingEmails = new Set(accounts.map(a => a.email.toLowerCase()));
        const seenInFile = new Set<string>();
        const rows: ParsedAccountRow[] = [];

        for (let i = 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length === 0 || !row[0]) continue;

          const email = String(row[0] || '').trim().toLowerCase();
          const fullName = String(row[1] || '').trim();
          const rawLevel = Number(row[2]) || 3;
          let orgCode = String(row[3] || 'CNTT').trim().toUpperCase();
          let orgName = String(row[4] || '').trim();
          const classCode = row[5] ? String(row[5]).trim().toUpperCase() : undefined;

          // Lookup matching org if name missing
          if (!orgName) {
            const foundOrg = organizations.find(o => o.code === orgCode);
            orgName = foundOrg ? foundOrg.name : orgCode;
          }

          let roleLevel: RoleLevel = 3;
          if (rawLevel === 4) roleLevel = 4;
          else if (rawLevel === 2) roleLevel = 2;
          else if (rawLevel === 1) roleLevel = 1;

          let isValid = true;
          let isDuplicate = false;
          let errorMessage = '';

          // Basic validation
          if (!email || !email.includes('@')) {
            isValid = false;
            errorMessage = 'Email không hợp lệ';
          } else if (!fullName) {
            isValid = false;
            errorMessage = 'Thiếu họ tên cán bộ / đơn vị';
          } else if (existingEmails.has(email) || seenInFile.has(email)) {
            isDuplicate = true;
            isValid = false;
            errorMessage = `Email ${email} đã được cấp tài khoản`;
          } else if (roleLevel === 2 && !classCode && !orgCode.startsWith('CLB') && !orgCode.startsWith('DOI')) {
            // Role 2 without classCode unless CLB/DOI
            isValid = false;
            errorMessage = 'Cấp Chi đoàn bắt buộc phải có Mã Chi đoàn';
          }

          seenInFile.add(email);

          rows.push({
            email,
            fullName,
            roleLevel,
            orgCode,
            orgName,
            classCode: roleLevel === 2 ? classCode : undefined,
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
      showToast('Không có tài khoản nào hợp lệ để tạo!', 'error');
      return;
    }

    const accountsToCreate: Omit<SystemUserAccount, 'id' | 'createdAt'>[] = validRows.map(r => ({
      email: r.email,
      fullName: r.fullName,
      roleLevel: r.roleLevel,
      orgCode: r.orgCode,
      orgName: r.orgName,
      classCode: r.classCode,
      status: 'Active',
    }));

    const count = batchAddAccounts(accountsToCreate);
    if (count > 0) {
      onClose();
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const duplicateCount = parsedRows.filter(r => r.isDuplicate).length;
  const errorCount = parsedRows.filter(r => !r.isValid && !r.isDuplicate).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-emerald-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-300" />
            <h3 className="font-bold text-sm sm:text-base">
              Cấp Tài Khoản Hệ Thống Hàng Loạt Bằng File Excel / CSV
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
              <p className="font-bold text-emerald-900 text-xs">Bước 1: Tải file mẫu danh sách cấp tài khoản</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Cấu trúc: Email, Họ và tên, Cấp phân quyền (4: Trường, 3: Khoa, 2: Chi đoàn/CLB), Mã đơn vị, Tên đơn vị, Mã Chi đoàn.
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
            <p className="font-bold text-slate-800 mb-2">Bước 2: Chọn tệp Excel danh sách tài khoản (.xlsx)</p>
            <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-emerald-50/20 transition">
              <Upload className="w-8 h-8 text-emerald-600 mb-2" />
              <span className="font-bold text-slate-800 text-xs">
                {fileName ? fileName : 'Bấm vào đây để chọn tệp .xlsx'}
              </span>
              <span className="text-[11px] text-slate-400 mt-1">
                Hỗ trợ duy nhất định dạng Excel (.xlsx) - Tự động kiểm tra trùng lặp email
              </span>
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
                  Xem trước danh sách tài khoản ({parsedRows.length} dòng):
                </span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    ✓ {validCount} hợp lệ
                  </span>
                  {duplicateCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                      ⚠ {duplicateCount} trùng email
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
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Tên Cán Bộ / Ban</th>
                      <th className="px-3 py-2">Cấp Quyền</th>
                      <th className="px-3 py-2">Đơn Vị</th>
                      <th className="px-3 py-2">Chi Đoàn</th>
                      <th className="px-3 py-2">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r, idx) => (
                      <tr key={idx} className={!r.isValid ? 'bg-rose-50/40' : 'hover:bg-slate-50'}>
                        <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                        <td className="px-3 py-2 font-mono font-bold text-slate-900">{r.email}</td>
                        <td className="px-3 py-2 font-medium text-slate-800">{r.fullName}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-sm font-bold text-[10px] ${
                              r.roleLevel === 4
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : r.roleLevel === 3
                                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}
                          >
                            Cấp {r.roleLevel}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-700">{r.orgName} ({r.orgCode})</td>
                        <td className="px-3 py-2 font-mono text-[11px] text-slate-500">{r.classCode || '—'}</td>
                        <td className="px-3 py-2">
                          {r.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Sẵn sàng cấp
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
              Cấp {validCount} Tài Khoản Vào Hệ Thống
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
