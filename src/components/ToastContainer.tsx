import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ToastItem } from '../types';
import {
  Calendar,
  Award,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  Sparkles,
  TrendingUp,
  FileCheck,
  ChevronRight,
  Flame
} from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full px-4 sm:px-0 pointer-events-none">
      {toasts.map((toast: ToastItem) => (
        <SingleToastCard key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
      ))}
    </div>
  );
};

interface SingleToastCardProps {
  toast: ToastItem;
  onDismiss: () => void;
}

const SingleToastCard: React.FC<SingleToastCardProps> = ({ toast, onDismiss }) => {
  const isActivity = toast.category === 'activity';
  const isScore = toast.category === 'score';
  const isProof = toast.category === 'proof';
  const isCert = toast.category === 'certificate';

  // Category styling
  const getCategoryStyles = () => {
    if (isActivity) {
      return {
        bg: 'bg-slate-950/95 border-blue-600/70 shadow-blue-950/40',
        badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        badgeLabel: 'Hoạt Động Mới',
        icon: <Calendar className="w-5 h-5 text-blue-400" />,
        progressBg: 'bg-blue-500',
      };
    }
    if (isScore) {
      return {
        bg: 'bg-emerald-950/95 border-emerald-600/70 shadow-emerald-950/40',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        badgeLabel: 'Điểm Rèn Luyện',
        icon: <Award className="w-5 h-5 text-emerald-400" />,
        progressBg: 'bg-emerald-500',
      };
    }
    if (isProof) {
      return {
        bg: 'bg-amber-950/95 border-amber-600/70 shadow-amber-950/40',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        badgeLabel: 'Minh Chứng ĐRL',
        icon: <FileCheck className="w-5 h-5 text-amber-400" />,
        progressBg: 'bg-amber-500',
      };
    }
    if (isCert) {
      return {
        bg: 'bg-purple-950/95 border-purple-600/70 shadow-purple-950/40',
        badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        badgeLabel: 'Giấy Chứng Nhận',
        icon: <Sparkles className="w-5 h-5 text-purple-400" />,
        progressBg: 'bg-purple-500',
      };
    }

    // Default based on type
    if (toast.type === 'error') {
      return {
        bg: 'bg-rose-950/95 border-rose-600/70 shadow-rose-950/40',
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        badgeLabel: 'Lỗi Hệ Thống',
        icon: <AlertTriangle className="w-5 h-5 text-rose-400" />,
        progressBg: 'bg-rose-500',
      };
    }
    if (toast.type === 'warning') {
      return {
        bg: 'bg-amber-950/95 border-amber-600/70 shadow-amber-950/40',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        badgeLabel: 'Cảnh Báo',
        icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
        progressBg: 'bg-amber-500',
      };
    }
    return {
      bg: 'bg-slate-900/95 border-slate-700/80 shadow-slate-950/40',
      badgeBg: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
      badgeLabel: 'Thông Báo',
      icon: <Info className="w-5 h-5 text-sky-400" />,
      progressBg: 'bg-sky-500',
    };
  };

  const styles = getCategoryStyles();
  const duration = toast.durationMs || 5000;

  return (
    <div
      className={`pointer-events-auto rounded-2xl shadow-2xl border text-xs overflow-hidden backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in ${styles.bg}`}
    >
      <div className="p-4 flex items-start gap-3 relative">
        {/* Leading Category Icon */}
        <div className="shrink-0 mt-0.5 p-1.5 rounded-xl bg-white/10">{styles.icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${styles.badgeBg}`}
            >
              {styles.badgeLabel}
            </span>
            {toast.title && <h4 className="font-bold text-white text-xs">{toast.title}</h4>}
          </div>

          <p className="text-slate-200 text-xs leading-relaxed font-normal">{toast.message}</p>

          {/* Action button */}
          {toast.actionLabel && toast.onAction && (
            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  toast.onAction?.();
                  onDismiss();
                }}
                className="inline-flex items-center gap-1 px-3 py-1 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white rounded-lg text-[11px] font-bold transition shadow-xs cursor-pointer"
              >
                <span>{toast.actionLabel}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          title="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar Animation */}
      <div className="w-full bg-white/10 h-1 overflow-hidden">
        <div
          className={`h-full ${styles.progressBg}`}
          style={{
            animation: `shrinkWidth ${duration}ms linear forwards`,
          }}
        />
      </div>

      <style>{`
        @keyframes shrinkWidth {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};
