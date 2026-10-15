import React, { useState } from 'react';
import {
  X,
  FileText,
  Printer,
  Download,
  Settings2,
  CheckCircle2,
  Calendar,
  Building,
  UserCheck,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { ExportReportOptions, generateReportHtml, printReportAsPdf, downloadOfflineReport } from '../utils/pdfExportUtils';

interface ReportPdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportOptions: ExportReportOptions;
}

export const ReportPdfExportModal: React.FC<ReportPdfExportModalProps> = ({
  isOpen,
  onClose,
  reportOptions: initialOptions
}) => {
  const [options, setOptions] = useState<ExportReportOptions>(initialOptions);
  const [activeTab, setActiveTab] = useState<'preview' | 'settings'>('preview');

  // Keep internal state updated when props change
  React.useEffect(() => {
    setOptions(initialOptions);
  }, [initialOptions]);

  if (!isOpen) return null;

  const previewHtml = generateReportHtml(options);

  const handlePrint = () => {
    printReportAsPdf(options);
  };

  const handleDownloadOffline = () => {
    downloadOfflineReport(options);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden my-0 sm:my-6">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Xuất Báo Cáo & Sổ Điểm (PDF / Offline)</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Chuẩn Đoàn NLU
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Xem trước văn bản, cấu hình thông tin ký duyệt và xuất file PDF lưu trữ ngoại tuyến
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem Trước Báo Cáo</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Cấu Hình Ký Duyệt</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50 dark:bg-slate-950/60">
          {activeTab === 'preview' ? (
            <div className="flex flex-col items-center">
              {/* Quick Info bar */}
              <div className="w-full max-w-4xl mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Báo cáo gồm <strong>{options.rows.length}</strong> bản ghi · Khổ giấy <strong>{options.orientation === 'portrait' ? 'A4 Dọc' : 'A4 Ngang'}</strong>
                  </span>
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  Bấm <strong>&quot;Lưu PDF / In Ngay&quot;</strong> để mở hộp thoại in của trình duyệt và chọn &quot;Save as PDF&quot;.
                </div>
              </div>

              {/* Document Paper Container */}
              <div className="w-full max-w-4xl bg-white shadow-lg border border-slate-200 rounded-xl overflow-hidden p-8 sm:p-10 text-slate-900 min-h-[500px]">
                <iframe
                  title="PDF Report Preview"
                  srcDoc={previewHtml}
                  className="w-full h-[580px] border-0 rounded"
                />
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-emerald-600" />
                <span>Tùy Chỉnh Thông Tin Báo Cáo & Ký Duyệt</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tiêu Đề Báo Cáo
                  </label>
                  <input
                    type="text"
                    value={options.title}
                    onChange={(e) => setOptions({ ...options, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Đơn Vị Ban Hành
                  </label>
                  <input
                    type="text"
                    value={options.unitName}
                    onChange={(e) => setOptions({ ...options, unitName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Học Kỳ & Năm Học
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={options.semester}
                      onChange={(e) => setOptions({ ...options, semester: e.target.value })}
                      placeholder="Học kỳ 2"
                      className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      value={options.academicYear}
                      onChange={(e) => setOptions({ ...options, academicYear: e.target.value })}
                      placeholder="2025 - 2026"
                      className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Khổ Giấy & Hướng In
                  </label>
                  <select
                    value={options.orientation}
                    onChange={(e) => setOptions({ ...options, orientation: e.target.value as 'portrait' | 'landscape' })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="landscape">A4 Khổ Ngang (Khuyên dùng cho Bảng thi đua)</option>
                    <option value="portrait">A4 Khổ Dọc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Người Lập Bảng
                  </label>
                  <input
                    type="text"
                    value={options.generatedBy}
                    onChange={(e) => setOptions({ ...options, generatedBy: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Chức Vụ Người Ký Duyệt
                  </label>
                  <input
                    type="text"
                    value={options.signerTitle}
                    onChange={(e) => setOptions({ ...options, signerTitle: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Họ Tên Người Ký Duyệt
                  </label>
                  <input
                    type="text"
                    value={options.signerName}
                    onChange={(e) => setOptions({ ...options, signerName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Áp Dụng & Xem Trước</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 flex-wrap gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>Ngày kết xuất: {new Date().toLocaleDateString('vi-VN')}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadOffline}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              title="Tải tệp HTML báo cáo độc lập để xem offline mọi lúc mọi nơi"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Tải Báo Cáo Offline (.html)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Lưu PDF / In Ngay (Print to PDF)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
