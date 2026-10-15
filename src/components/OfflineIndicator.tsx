import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff, Database } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-5 left-5 z-50 flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 py-2.5 text-xs font-bold shadow-xl shadow-amber-900/30 border border-amber-400/40 animate-in slide-in-from-bottom-4 duration-300">
      <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
      <WifiOff className="w-4 h-4 text-amber-200" />
      <div className="flex flex-col">
        <span>Đang hoạt động Chế độ Ngoại Tuyến (Offline)</span>
        <span className="text-[10px] font-normal text-amber-100/90 flex items-center gap-1">
          <Database className="w-3 h-3 inline" /> Dữ liệu đã được nạp từ bộ nhớ đệm PWA Service Worker.
        </span>
      </div>
    </div>
  );
};
