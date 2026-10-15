import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  HardDrive,
  Database,
  CloudUpload,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Shield,
  X,
  FileJson,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface SystemBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCleanup?: () => void;
}

export const SystemBackupModal: React.FC<SystemBackupModalProps> = ({ isOpen, onClose, onOpenCleanup }) => {
  const { backups, createSystemBackup, accessToken, academicYear } = useApp();
  const [isBackingUp, setIsBackingUp] = useState(false);

  if (!isOpen) return null;

  const handlePerformBackup = async () => {
    setIsBackingUp(true);
    try {
      await createSystemBackup();
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-0 sm:my-6 animate-in fade-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-sky-800 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-300" />
              Sao Lưu Tự Động & Bảo Toàn Dữ Liệu Lên Google Drive
            </h3>
            <p className="text-xs text-emerald-100">
              Đồng bộ hóa thời gian thực và tự động sao lưu hằng ngày (Daily Auto-Backup)
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-emerald-200 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs text-slate-700 dark:text-slate-300 custom-scrollbar">
          {/* Cloud Status Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-sky-50 dark:from-emerald-950/40 dark:to-sky-950/40 border border-emerald-200 dark:border-emerald-800/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white shrink-0 shadow-xs">
                <HardDrive className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">Google Drive Workspace Cloud</span>
                  {accessToken ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã kết nối
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                      Chưa liên kết
                    </span>
                  )}
                </div>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                  Tất cả hồ sơ sinh viên, điểm rèn luyện, chứng nhận điện tử và hoạt động {academicYear} được mã hóa an toàn.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isBackingUp}
              onClick={handlePerformBackup}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition shrink-0 cursor-pointer"
            >
              {isBackingUp ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
                  Đang sao lưu...
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4 text-emerald-200" />
                  Sao Lưu Hệ Thống Ngay
                </>
              )}
            </button>
          </div>

          {/* Quota Cleanup & Optimization Card */}
          {onOpenCleanup && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Tự Động Dọn Dẹp & Giải Phóng Quota Firestore</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    Quét và xóa các bản ghi trùng lặp, nhật ký quá hạn & lưu trữ sao lưu tệp JSON để giải phóng hạn mức DB.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCleanup();
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl shadow-xs transition cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mở Công Cụ Dọn Dẹp</span>
              </button>
            </div>
          )}

          {/* Backup History */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                Lịch Sử Các Bản Sao Lưu Gần Nhất ({backups.length})
              </h4>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Tự động kích hoạt định kỳ</span>
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
              {backups.length === 0 ? (
                <div className="p-6 text-center text-slate-400 dark:text-slate-500">Chưa có bản sao lưu nào.</div>
              ) : (
                backups.map(b => (
                  <div key={b.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <div className="flex items-start gap-2.5">
                      <FileJson className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white font-mono text-[11px]">{b.fileName}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Thời gian: <span className="font-semibold text-slate-700 dark:text-slate-300">{b.timestamp}</span> • Dung lượng:{' '}
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{b.fileSizeKb} KB</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          <span>{b.stats.students} Sinh viên</span>
                          <span>•</span>
                          <span>{b.stats.activities} Hoạt động</span>
                          <span>•</span>
                          <span>{b.stats.certificates} Giấy chứng nhận</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {b.driveUrl ? (
                        <a
                          href={b.driveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition"
                        >
                          <HardDrive className="w-3.5 h-3.5 text-sky-600" />
                          Mở trên Drive
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">Đã xuất tệp máy tính</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-slate-400 dark:text-slate-500 text-[11px]">
            <span>Cơ chế bảo vệ dữ liệu tự động hằng ngày đảm bảo tính toàn vẹn 100%.</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
