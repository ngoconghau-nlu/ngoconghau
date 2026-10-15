import React from 'react';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getBreadcrumbPath } from '../../config/navigationConfig';

interface AccessDeniedProps {
  requestedTab: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ requestedTab }) => {
  const { user, setActiveTab, loginGoogle } = useApp();
  const pathInfo = getBreadcrumbPath(requestedTab);
  const isGuest = user.currentRole.roleLevel === 0;

  return (
    <div className="py-16 px-4 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4 shadow-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">
        Bảo Mật & Phân Quyền NLU Youth
      </span>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        Khu Vực Giới Hạn Quyền Truy Cập
      </h2>

      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
        Phân hệ <strong className="text-slate-800 dark:text-slate-200">{pathInfo.currentLabel}</strong> yêu cầu cấp bậc quyền hạn cao hơn tài khoản hiện tại của bạn.
      </p>

      {/* User Role Card */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-left max-w-md w-full mb-6 space-y-1.5">
        <div className="flex justify-between">
          <span className="text-slate-500">Tài khoản:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{user.email || 'Khách vãng lai'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Vai trò hiện tại:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">{user.currentRole.roleName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Cấp bậc:</span>
          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">Cấp {user.currentRole.roleLevel}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 flex-wrap justify-center">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs border border-slate-300 dark:border-slate-700 shadow-2xs transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Dashboard Tổng Quan</span>
        </button>

        {isGuest && (
          <button
            type="button"
            onClick={loginGoogle}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-sm transition cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Đăng Nhập Google SSO</span>
          </button>
        )}
      </div>
    </div>
  );
};
