import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  LogOut,
  LogIn,
  ShieldCheck,
  ShieldAlert,
  User,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface UserProfileMenuProps {
  direction?: 'up' | 'down';
  align?: 'left' | 'right';
  isSidebar?: boolean;
  isCollapsed?: boolean;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  direction = 'down',
  align = 'right',
  isSidebar = false,
  isCollapsed = false
}) => {
  const {
    user,
    googleUser,
    isConnectingGoogle,
    loginGoogle,
    logoutGoogle,
    switchRole
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getRoleBadgeStyle = (level: number) => {
    switch (level) {
      case 4:
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700 ring-amber-400';
      case 3:
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-700 ring-blue-400';
      case 2:
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 ring-emerald-400';
      case 1:
        return 'bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-300 border-teal-300 dark:border-teal-700 ring-teal-400';
      case 0:
      default:
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700 ring-rose-400';
    }
  };

  const getPopoverPositionClasses = () => {
    if (isSidebar) {
      if (isCollapsed) return 'bottom-0 left-full ml-3';
      return 'bottom-full left-0 mb-2';
    }
    const verticalClass = direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2';
    const horizontalClass = align === 'left' ? 'left-0' : 'right-0';
    return `${verticalClass} ${horizontalClass}`;
  };

  if (!googleUser && !user.isAuthenticated) {
    return (
      <button
        type="button"
        onClick={loginGoogle}
        disabled={isConnectingGoogle}
        className="inline-flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-emerald-800 to-teal-900 hover:from-emerald-900 hover:to-slate-900 dark:from-emerald-700 dark:to-teal-800 dark:hover:from-emerald-600 dark:hover:to-teal-700 text-white px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold shadow-sm shadow-emerald-900/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shrink-0"
        title="Đăng nhập tài khoản Google SSO"
      >
        <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 shrink-0" />
        <span className="truncate">{isConnectingGoogle ? 'Đang xác thực...' : 'Đăng nhập SSO'}</span>
      </button>
    );
  }

  return (
    <div className={`relative ${isSidebar && isCollapsed ? 'flex justify-center shrink-0' : isSidebar ? 'w-full' : 'shrink-0'}`} ref={containerRef}>
      {isSidebar ? (
        /* Sidebar Trigger Button */
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 hover:bg-slate-800/90 text-xs transition cursor-pointer text-left ${
            isCollapsed ? 'w-9 h-9 justify-center p-0' : 'w-full px-2.5 py-1.5'
          }`}
          aria-expanded={isOpen}
          aria-haspopup="true"
          title={`Tài khoản: ${user.fullName} (Cấp ${user.currentRole.roleLevel})`}
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              className="w-5.5 h-5.5 rounded-full object-cover border border-emerald-500 shrink-0"
            />
          ) : (
            <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          )}

          {!isCollapsed && (
            <>
              <div className="min-w-0 flex-1">
                <span className="font-bold text-white block truncate text-[11px] leading-tight">
                  {user.fullName || user.email}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {user.currentRole.roleName} (Cấp {user.currentRole.roleLevel})
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </>
          )}
        </button>
      ) : (
        /* Topbar Trigger Button */
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 h-8.5 px-2.5 sm:px-3 rounded-xl border text-xs font-semibold transition-all shadow-2xs ${getRoleBadgeStyle(
            user.currentRole.roleLevel
          )} hover:shadow-xs hover:scale-[1.02] active:scale-[0.98] cursor-pointer`}
          aria-expanded={isOpen}
          aria-haspopup="true"
          title={`Tài khoản: ${user.fullName} (Cấp ${user.currentRole.roleLevel})`}
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              className="w-5.5 h-5.5 rounded-full object-cover border border-slate-300/80 dark:border-slate-600 shrink-0"
            />
          ) : (
            <div className="w-5.5 h-5.5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-black shrink-0">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="text-left block">
            <div className="flex items-center gap-1 leading-none">
              <span className="text-[9.5px] font-bold uppercase tracking-wider opacity-80">
                {user.isAuthenticated ? `Cấp ${user.currentRole.roleLevel}` : 'Chưa cấp quyền'}
              </span>
              {user.isAuthenticated && (
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <div className="font-bold text-slate-900 dark:text-white truncate max-w-[100px] sm:max-w-[150px] leading-tight text-[11px] sm:text-[11.5px] mt-0.5">
              {user.fullName}
            </div>
          </div>

          <ChevronDown className={`w-3 h-3 ml-0.5 opacity-70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* Profile & SSO Information Popover */}
      {isOpen && (
        <div className={`absolute ${getPopoverPositionClasses()} w-80 sm:w-84 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 py-3 divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-150`}>
          {/* User Header */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500 shadow-xs"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-800 text-white flex items-center justify-center text-sm font-black shadow-xs">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                  {user.fullName}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-mono mt-0.5">
                  {user.email}
                </p>
              </div>
            </div>

            {/* SSO Verification Status Badge */}
            <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Trạng thái xác thực:</span>
                <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> Google SSO Đã Duyệt
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Đơn vị công tác:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                  {user.currentRole.orgName || 'Toàn trường'}
                </span>
              </div>
              {user.studentId && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Mã số sinh viên:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {user.studentId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Role Switcher (Preview / Demo Modes) */}
          {user.availableRoles && user.availableRoles.length > 1 && (
            <div className="p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
                Chuyển đổi vai trò công tác
              </p>
              <div className="space-y-1">
                {user.availableRoles.map(role => {
                  const isCurrent = user.currentRole.roleId === role.roleId;
                  return (
                    <button
                      key={role.roleId}
                      type="button"
                      onClick={() => {
                        switchRole(role.roleId);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition ${
                        isCurrent
                          ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 font-bold border border-emerald-200 dark:border-emerald-800'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                        <span className="truncate">{role.roleName}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        Cấp {role.roleLevel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-2">
            <button
              type="button"
              onClick={() => {
                logoutGoogle();
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              Đăng Xuất Google SSO
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
