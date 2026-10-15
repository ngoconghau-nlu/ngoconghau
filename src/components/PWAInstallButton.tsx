import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, PlusSquare, X, Smartphone, CheckCircle2 } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running as an installed standalone PWA, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={async () => {
          setIsInstalling(true);
          try {
            await install();
          } finally {
            setIsInstalling(false);
          }
        }}
        disabled={isInstalling}
        title="Cài đặt ứng dụng NLU Youth về màn hình chính (PWA)"
        className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 text-white animate-bounce" />
        <span className="hidden sm:inline">Cài Đặt App</span>
        <span className="sm:hidden">Cài App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not fired by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          title="Hướng dẫn cài đặt trên iPhone / iPad"
          className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-emerald-300 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden sm:inline">Cài App iOS</span>
          <span className="sm:hidden">Cài iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative text-left">
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Smartphone className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Cài đặt NLU Youth trên iOS
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Thêm ứng dụng vào Màn hình chính của iPhone / iPad để sử dụng toàn màn hình và mượt mà:
              </p>

              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <div>
                    Nhấn vào biểu tượng <strong className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold"><Share className="w-3.5 h-3.5 inline" /> Chia sẻ (Share)</strong> trên thanh công cụ Safari.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <div>
                    Cuộn xuống và chọn <strong className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold"><PlusSquare className="w-3.5 h-3.5 inline" /> Thêm vào MH chính (Add to Home Screen)</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <div>
                    Bấm <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">Thêm (Add)</strong> ở góc phải trên cùng để hoàn tất.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 py-3 text-sm font-bold text-white shadow-md shadow-emerald-600/25 transition cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // If not prompted yet on desktop or browser doesn't trigger beforeinstallprompt, provide a friendly trigger button
  return (
    <button
      type="button"
      onClick={() => {
        // If window has deferred prompt, attempt prompt, otherwise give tip
        if (install) {
          install();
        }
      }}
      title="Cài đặt NLU Youth làm ứng dụng di động / máy tính"
      className="hidden sm:inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 px-2.5 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
    >
      <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
      <span>Tải App PWA</span>
    </button>
  );
};
