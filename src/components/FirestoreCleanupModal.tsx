import React, { useState, useEffect } from 'react';
import {
  Trash2,
  Database,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  HardDrive,
  FileJson,
  AlertTriangle,
  X,
  CheckCircle2,
  Download,
  Clock,
  Archive,
  Layers,
  Users,
  Calendar,
  History
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  scanFirestoreQuotaMetrics,
  executeFirestoreCleanupAndArchive,
  ScanMetrics,
  CleanupResult
} from '../services/firestoreCleanupService';

interface FirestoreCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirestoreCleanupModal: React.FC<FirestoreCleanupModalProps> = ({ isOpen, onClose }) => {
  const { accessToken, showToast } = useApp();

  const [isScanning, setIsScanning] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [scanMetrics, setScanMetrics] = useState<ScanMetrics | null>(null);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);

  // Settings
  const [purgeDuplicates, setPurgeDuplicates] = useState(true);
  const [purgeStaleLogs, setPurgeStaleLogs] = useState(true);
  const [staleDays, setStaleDays] = useState(30);
  const [purgeSoftDeleted, setPurgeSoftDeleted] = useState(true);
  const [archiveBeforePurge, setArchiveBeforePurge] = useState(true);

  useEffect(() => {
    if (isOpen) {
      handleScan();
    }
  }, [isOpen, staleDays]);

  const handleScan = async () => {
    setIsScanning(true);
    setCleanupResult(null);
    try {
      const res = await scanFirestoreQuotaMetrics(staleDays);
      setScanMetrics(res);
    } catch (err: any) {
      showToast(err?.message || 'Không thể quét dung lượng Firestore.', 'error', {
        title: 'Lỗi Quét Dữ Liệu'
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleRunCleanup = async () => {
    if (!scanMetrics) return;

    setIsExecuting(true);
    try {
      const res = await executeFirestoreCleanupAndArchive(scanMetrics, {
        purgeDuplicateStudents: purgeDuplicates,
        purgeDuplicateActivities: purgeDuplicates,
        purgeDuplicateAttendance: purgeDuplicates,
        purgeStaleLogsDaysThreshold: staleDays,
        purgeSoftDeleted: purgeSoftDeleted,
        clearCompletedRetryQueue: true,
        archiveBeforePurging: archiveBeforePurge,
        driveAccessToken: accessToken
      });

      setCleanupResult(res);
      showToast(res.message, 'success', {
        title: 'Dọn Dẹp Thành Công'
      });

      // Refresh scan
      handleScan();
    } catch (err: any) {
      showToast(err?.message || 'Không thể hoàn tất tối ưu hóa Firestore.', 'error', {
        title: 'Thất Bại Khi Dọn Dẹp'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-sky-800 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-300" />
              Công Cụ Tự Động Dọn Dẹp & Lưu Trữ Firestore (Quota Optimizer)
            </h3>
            <p className="text-xs text-emerald-100 mt-0.5">
              Xóa bản ghi trùng lặp, nhật ký quá hạn & lưu trữ bảo toàn dữ liệu giải phóng hạn mức
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {/* Status Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-sky-950/40 border border-emerald-200 dark:border-emerald-800/60 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Tối Ưu Hạn Mức Firestore</h4>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                  Tự động quét để loại bỏ các bản ghi ghi đè trùng, log cũ và tài liệu đã xóa mềm.
                </p>
              </div>
            </div>

            <button
              onClick={handleScan}
              disabled={isScanning || isExecuting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl border border-slate-300 dark:border-slate-700 shadow-2xs transition cursor-pointer shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-emerald-600' : ''}`} />
              {isScanning ? 'Đang Quét...' : 'Quét Lại'}
            </button>
          </div>

          {/* Metrics Scan Results Grid */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              Kết Quả Quét Dữ Liệu Hiện Tại
            </h4>

            {isScanning ? (
              <div className="p-8 text-center text-slate-500 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
                Đang kiểm tra dung lượng các bộ sưu tập Firestore...
              </div>
            ) : scanMetrics ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500 text-[10px] uppercase font-bold flex items-center gap-1">
                    <Users className="w-3 h-3 text-sky-600" /> Sinh Viên Trùng
                  </div>
                  <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    {scanMetrics.duplicateStudentsCount}
                  </div>
                  <span className="text-[10px] text-slate-400">Bản ghi thừa</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500 text-[10px] uppercase font-bold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-600" /> Hoạt Động Trùng
                  </div>
                  <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    {scanMetrics.duplicateActivitiesCount}
                  </div>
                  <span className="text-[10px] text-slate-400">Tạo trùng lặp</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500 text-[10px] uppercase font-bold flex items-center gap-1">
                    <History className="w-3 h-3 text-amber-600" /> Log Cũ ({staleDays}+ Ngày)
                  </div>
                  <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    {scanMetrics.staleLogsCount}
                  </div>
                  <span className="text-[10px] text-slate-400">Nhật ký truy vết</span>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                  <div className="text-emerald-800 dark:text-emerald-300 text-[10px] uppercase font-bold flex items-center gap-1">
                    <Archive className="w-3 h-3 text-emerald-600" /> Dự Kiến Tiết Kiệm
                  </div>
                  <div className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-1">
                    ~{scanMetrics.estimatedQuotaSavingKb} KB
                  </div>
                  <span className="text-[10px] text-emerald-800/80 dark:text-emerald-300/80 font-medium">
                    {scanMetrics.totalCleanupTargetCount} bản ghi giải phóng
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Options Form */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Cấu Hình Tùy Chọn Tối Ưu Hóa & Dọn Dẹp
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={purgeDuplicates}
                  onChange={e => setPurgeDuplicates(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Loại bỏ bản ghi sinh viên & hoạt động trùng
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={purgeSoftDeleted}
                  onChange={e => setPurgeSoftDeleted(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Xóa triệt để hồ sơ trong Thùng rác
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer col-span-1 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={archiveBeforePurge}
                  onChange={e => setArchiveBeforePurge(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-bold text-emerald-800 dark:text-emerald-300">
                  Lưu trữ sao lưu tệp JSON & Google Drive trước khi dọn dẹp (Khuyên dùng: Bảo toàn 100% dữ liệu)
                </span>
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Ngưỡng dọn dẹp log quá hạn:</span>
              <select
                value={staleDays}
                onChange={e => setStaleDays(Number(e.target.value))}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold"
              >
                <option value={14}>Hơn 14 ngày</option>
                <option value={30}>Hơn 30 ngày (Chuẩn)</option>
                <option value={60}>Hơn 60 ngày</option>
                <option value={90}>Hơn 90 ngày</option>
              </select>
            </div>
          </div>

          {/* Cleanup Result Summary if executed */}
          {cleanupResult && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                {cleanupResult.message}
              </div>

              <div className="text-[11px] grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200 dark:border-emerald-800/60">
                <div>• Bản ghi trùng lặp đã xóa: {cleanupResult.purgedCategories.duplicateStudents + cleanupResult.purgedCategories.duplicateActivities}</div>
                <div>• Nhật ký quá hạn đã dọn: {cleanupResult.purgedCategories.staleLogs}</div>
                <div>• Thùng rác đã giải phóng: {cleanupResult.purgedCategories.softDeletedDocs}</div>
                <div>• Tệp sao lưu JSON: {cleanupResult.archivedFileName || 'Đã tải về máy'}</div>
              </div>

              {cleanupResult.driveFileUrl && (
                <div className="pt-1">
                  <a
                    href={cleanupResult.driveFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 dark:text-sky-300 hover:underline"
                  >
                    <HardDrive className="w-3.5 h-3.5" /> Mở bản lưu trữ trên Google Drive Workspace
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Cơ chế dọn dẹp lô (Batch purge) hạn chế tối đa ảnh hưởng tốc độ hệ thống.
            </span>

            <button
              onClick={handleRunCleanup}
              disabled={isExecuting || isScanning || !scanMetrics || scanMetrics.totalCleanupTargetCount === 0}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
                  Đang Lưu Trữ & Dọn Dẹp...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 text-emerald-200" />
                  Chạy Dọn Dẹp & Giải Phóng Quota Ngay
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
