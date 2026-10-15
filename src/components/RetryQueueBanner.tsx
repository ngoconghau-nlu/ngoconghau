import React, { useState, useEffect } from 'react';
import { firestoreRetryQueue, RetryQueueStats, RetryQueueItem } from '../services/firestoreRetryQueue';
import { useApp } from '../context/AppContext';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  Database,
  Wifi,
  WifiOff,
  CloudUpload,
  AlertTriangle,
  Zap
} from 'lucide-react';

interface RetryQueueBannerProps {
  onOpenCleanup?: () => void;
}

export const RetryQueueBanner: React.FC<RetryQueueBannerProps> = ({ onOpenCleanup }) => {
  const { showToast } = useApp();
  const [stats, setStats] = useState<RetryQueueStats>(() => firestoreRetryQueue.getStats());
  const [items, setItems] = useState<RetryQueueItem[]>(() => firestoreRetryQueue.getItems());
  const [isExpanded, setIsExpanded] = useState(false);
  const [isManualProcessing, setIsManualProcessing] = useState(false);

  useEffect(() => {
    const unsubscribe = firestoreRetryQueue.subscribe((newStats, newItems) => {
      setStats(newStats);
      setItems(newItems);
    });
    return () => unsubscribe();
  }, []);

  // Show banner if there are pending, processing, or failed queue items
  const shouldShow = stats.pending > 0 || stats.failed > 0 || stats.processing > 0 || stats.isQuotaExceeded;

  if (!shouldShow) {
    return null;
  }

  const handleManualProcess = async () => {
    setIsManualProcessing(true);
    try {
      const res = await firestoreRetryQueue.processQueue();
      if (res.successCount > 0) {
        showToast(
          `Đã tự động thử lại và lưu thành công ${res.successCount} thao tác lên Cloud Firestore!`,
          'success',
          { title: 'Retry-Queue Hoàn Tất' }
        );
      } else if (res.failedCount > 0) {
        showToast(
          `Có ${res.failedCount} thao tác chưa thể kết nối lại Firestore. Hệ thống đã lưu tạm và sẽ tự động thử lại khi có mạng tốt hơn.`,
          'warning',
          { title: 'Cảnh Báo Retry-Queue' }
        );
      }
    } catch (err) {
      console.error('Manual process queue failed:', err);
    } finally {
      setIsManualProcessing(false);
    }
  };

  const handleRetryFailed = () => {
    firestoreRetryQueue.retryFailed();
    showToast('Đã chuyển các tác vụ lỗi về trạng thái chờ và bắt đầu thử lại.', 'info', {
      title: 'Khôi Phục Hàng Đợi'
    });
  };

  const handleClearCompleted = () => {
    firestoreRetryQueue.clearCompleted();
  };

  return (
    <div className="bg-amber-950/95 dark:bg-amber-950/95 text-amber-100 border-2 border-amber-500/80 rounded-2xl p-3.5 sm:p-4 shadow-xl shadow-amber-950/30 backdrop-blur-md mb-4 transition-all animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Column: Icon & Info */}
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-amber-900/80 border border-amber-600/80 text-amber-300 flex items-center justify-center shrink-0 shadow-xs">
            {stats.isProcessing || isManualProcessing ? (
              <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
            ) : stats.isQuotaExceeded ? (
              <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
            ) : (
              <CloudUpload className="w-5 h-5 text-amber-300" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-500 text-slate-950 tracking-wider">
                Hàng Đợi Ghi Firestore (Retry-Queue)
              </span>

              {stats.isQuotaExceeded && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10.5px] font-black uppercase tracking-wider animate-pulse">
                  <Zap className="w-3 h-3 text-slate-950" />
                  Đạt Hạn Mức Firestore Ngày (Quota Exceeded)
                </span>
              )}

              {stats.isOnline ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-[10.5px] font-bold">
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  Trực tuyến
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-950/80 border border-rose-700/80 text-rose-300 text-[10.5px] font-bold">
                  <WifiOff className="w-3 h-3 text-rose-400" />
                  Ngoại tuyến (Offline)
                </span>
              )}
            </div>

            <p className="text-xs font-semibold text-amber-200 mt-1 leading-snug">
              {stats.isQuotaExceeded ? (
                <span>
                  ⚡ <strong className="text-white font-extrabold">Đã đạt hạn mức ghi miễn phí ngày của Cloud Firestore.</strong> Dữ liệu đã được <strong className="text-emerald-300 underline font-black">lưu an toàn 100% trong bộ nhớ máy (LocalStorage)</strong> và sẽ tự động đồng bộ khi Cloud Firestore đặt lại hạn mức.
                </span>
              ) : (
                <>
                  Hiện có <strong className="text-white font-extrabold">{stats.pending} thao tác</strong> đang chờ đồng bộ tự động khi có kết nối Cloud Firestore.
                  {stats.failed > 0 && (
                    <span className="text-rose-300 ml-1">
                      ({stats.failed} thao tác gặp lỗi kết nối).
                    </span>
                  )}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap justify-end">
          <button
            type="button"
            onClick={handleManualProcess}
            disabled={stats.isProcessing || isManualProcessing || !stats.isOnline}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${stats.isProcessing || isManualProcessing ? 'animate-spin' : ''}`} />
            <span>
              {stats.isProcessing || isManualProcessing ? 'Đang thử lại...' : 'Thử Lại Ngay'}
            </span>
          </button>

          {onOpenCleanup && (
            <button
              type="button"
              onClick={onOpenCleanup}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
              title="Mở công cụ dọn dẹp bản ghi trùng lặp và lưu trữ dữ liệu cũ để giải phóng dung lượng Quota"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Dọn Dẹp Quota</span>
            </button>
          )}

          {stats.failed > 0 && (
            <button
              type="button"
              onClick={handleRetryFailed}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-900/90 hover:bg-amber-800 border border-amber-600/80 text-amber-100 font-bold text-xs rounded-xl transition cursor-pointer"
              title="Đặt lại trạng thái các tác vụ thất bại để thử lại"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
              <span>Thử lại {stats.failed} tác vụ lỗi</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-900/50 hover:bg-amber-900/80 border border-amber-700/80 text-amber-200 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            <span>{isExpanded ? 'Thu gọn' : `Xem chi tiết (${items.length})`}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Items List */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-amber-800/80 space-y-2 text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-300 uppercase tracking-wide">
            <span>Danh sách các thao tác trong Hàng đợi thử lại:</span>
            <button
              type="button"
              onClick={handleClearCompleted}
              className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-200 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Dọn dẹp tác vụ xong</span>
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {items.length === 0 ? (
              <p className="text-amber-300/70 text-xs italic">Hàng đợi trống.</p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="p-2 rounded-xl bg-amber-900/40 border border-amber-800/60 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {item.status === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : item.status === 'failed' ? (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : item.status === 'processing' ? (
                      <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-400/80 shrink-0" />
                    )}

                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{item.description}</p>
                      <p className="text-[10.5px] text-amber-200/80 flex items-center gap-2 flex-wrap">
                        <span>Loại: {item.type}</span>
                        <span>•</span>
                        <span>Đã thử: {item.retryCount}/{item.maxRetries} lần</span>
                        {item.lastError && (
                          <span className="text-rose-300 font-mono truncate max-w-xs" title={item.lastError}>
                            ({item.lastError})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => firestoreRetryQueue.removeItem(item.id)}
                    className="p-1 text-amber-400/70 hover:text-rose-300 transition cursor-pointer"
                    title="Xóa tác vụ này khỏi hàng đợi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
