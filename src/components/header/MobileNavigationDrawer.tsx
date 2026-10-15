import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronDown,
  ExternalLink,
  Sun,
  Moon,
  HelpCircle,
  Edit2,
  ShieldAlert,
  CloudUpload,
  LogOut,
  LogIn,
  Search,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  CANONICAL_NAVIGATION_CONFIG,
  NAVIGATION_GROUPS,
  getCanonicalItem,
  resolveIcon,
  getEffectiveNavItems,
  NavigationItemConfig
} from '../../config/navigationConfig';
import { CustomNavItem } from '../../types';

interface MobileNavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHelp: () => void;
  onOpenLogoEditor: () => void;
  onOpenTrash: () => void;
  onOpenBackup: () => void;
  onOpenSearch: () => void;
}

export const MobileNavigationDrawer: React.FC<MobileNavigationDrawerProps> = ({
  isOpen,
  onClose,
  onOpenHelp,
  onOpenLogoEditor,
  onOpenTrash,
  onOpenBackup,
  onOpenSearch
}) => {
  const {
    user,
    googleUser,
    loginGoogle,
    logoutGoogle,
    theme,
    toggleTheme,
    activeTab,
    setActiveTab,
    customNavItems,
    headerBranding
  } = useApp();

  const isDarkMode = theme === 'dark';

  // Find which item contains activeTab to auto-expand that accordion!
  const defaultExpandedId = React.useMemo(() => {
    for (const item of CANONICAL_NAVIGATION_CONFIG) {
      if (item.subItems && item.subItems.some(sub => sub.targetTab === activeTab)) {
        return item.id;
      }
    }
    return activeTab;
  }, [activeTab]);

  const [expandedNavId, setExpandedNavId] = useState<string | null>(defaultExpandedId);

  // Auto-expand group containing active tab when activeTab changes or drawer opens
  useEffect(() => {
    if (isOpen) {
      setExpandedNavId(defaultExpandedId);
    }
  }, [isOpen, defaultExpandedId]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const userRoleLevel = user.currentRole.roleLevel ?? 0;

  // Single source of truth: merge custom items with canonical and filter by permissions & visibility
  const visibleNavItems = React.useMemo(() => {
    return getEffectiveNavItems(customNavItems, userRoleLevel);
  }, [customNavItems, userRoleLevel]);

  if (!isOpen) return null;

  const handleSelectTab = (targetTab: string) => {
    if (targetTab === 'system-ui-branding') {
      onClose();
      onOpenLogoEditor();
    } else if (targetTab === 'system-backup') {
      onClose();
      onOpenBackup();
    } else if (targetTab === 'system-trash') {
      onClose();
      onOpenTrash();
    } else if (targetTab === 'system-help') {
      onClose();
      onOpenHelp();
    } else {
      setActiveTab(targetTab);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[80] lg:hidden flex justify-end" role="dialog" aria-modal="true" aria-label="Menu điều hướng di động">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-xs sm:max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-2.5">
            {headerBranding?.logoUrl ? (
              <img
                src={headerBranding.logoUrl}
                alt="Logo"
                className="w-8 h-8 object-contain rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-800 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xs shrink-0">
                NLU
              </div>
            )}
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                {headerBranding?.titleText || 'NLU YOUTH 2026'}
              </h3>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                Menu Điều Hướng Di Động
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Search Action */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSearch();
            }}
            className="w-full min-h-[44px] flex items-center justify-between px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-medium cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Tìm kiếm chức năng nhanh...</span>
            </span>
            <kbd className="text-[10px] bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono">
              Tìm
            </kbd>
          </button>
        </div>

        {/* User Profile / Auth Section */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20 shrink-0">
          {googleUser || user.isAuthenticated ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="w-9 h-9 rounded-full object-cover border border-emerald-500 shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-black shrink-0">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {user.fullName}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="px-1.5 py-0.5 rounded font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      Cấp {user.currentRole.roleLevel}
                    </span>
                    <span className="truncate">{user.currentRole.roleName}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  logoutGoogle();
                  onClose();
                }}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer shrink-0"
                title="Đăng xuất"
                aria-label="Đăng xuất Google SSO"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                loginGoogle();
                onClose();
              }}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 text-white text-xs font-bold shadow-xs hover:brightness-110 active:scale-95 transition cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-amber-300" />
              <span>Đăng nhập Google SSO</span>
            </button>
          )}
        </div>

        {/* Quick Utility Tools in Drawer */}
        <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1 text-xs shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex-1 min-h-[40px] flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
            <span className="text-[11px]">{isDarkMode ? 'Giao diện Sáng' : 'Giao diện Tối'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenHelp();
            }}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            title="Trợ giúp & Hướng dẫn"
            aria-label="Mở trợ giúp"
          >
            <HelpCircle className="w-4 h-4 text-emerald-600" />
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenLogoEditor();
            }}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition cursor-pointer"
            title="Chỉnh sửa logo thương hiệu (Cấp 4)"
            aria-label="Chỉnh sửa logo"
          >
            <Edit2 className="w-4 h-4 text-amber-600" />
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenTrash();
            }}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition cursor-pointer"
            title="Thùng rác phục hồi (Cấp 4)"
            aria-label="Mở thùng rác"
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenBackup();
            }}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition cursor-pointer"
            title="Sao lưu Drive"
            aria-label="Sao lưu Drive"
          >
            <CloudUpload className="w-4 h-4 text-emerald-600" />
          </button>
        </div>

        {/* Navigation Items List with Accordions for Sub-menus */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <p className="px-2 pt-1 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Phân hệ Quản lý ({NAVIGATION_GROUPS.length} Nhóm Chức Năng)
          </p>
          {(() => {
            // Group visibleNavItems by canonical group IDs
            const groupedMap = new Map<string, NavigationItemConfig[]>();
            NAVIGATION_GROUPS.forEach(g => groupedMap.set(g.id, []));
            visibleNavItems.forEach(item => {
              const gKey = item.group || 'OVERVIEW';
              const list = groupedMap.get(gKey) || [];
              list.push(item);
              groupedMap.set(gKey, list);
            });

            return NAVIGATION_GROUPS.map(group => {
              const rawItems = groupedMap.get(group.id) || [];
              const itemsInGroup = rawItems.filter((item, index, self) => index === self.findIndex(t => t.id === item.id));
              if (itemsInGroup.length === 0) return null;

              const isGroupExpanded = expandedNavId === group.id;
              const GroupIcon = group.iconName ? resolveIcon(group.iconName) : Sparkles;
              const singleItemInGroup = itemsInGroup.length === 1 ? itemsInGroup[0] : null;
              const singleSubItems = singleItemInGroup?.subItems || [];

              // Case 1: 1 item with no sub-items
              if (singleItemInGroup && singleSubItems.length === 0) {
                const IconComp = resolveIcon(singleItemInGroup.iconName || group.iconName);
                const isActive = activeTab === singleItemInGroup.id;

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => handleSelectTab(singleItemInGroup.id)}
                    className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2 text-xs rounded-xl font-bold transition ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <IconComp className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                      <span className="truncate">{group.label}</span>
                    </span>
                    {singleItemInGroup.badge && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 uppercase ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        {singleItemInGroup.badge}
                      </span>
                    )}
                  </button>
                );
              }

              // Case 2: 1 item with sub-items
              if (singleItemInGroup && singleSubItems.length > 0) {
                const IconComp = resolveIcon(singleItemInGroup.iconName || group.iconName);
                const isSubActive = singleSubItems.some(sub => sub.targetTab === activeTab);
                const isActive = activeTab === singleItemInGroup.id || isSubActive;

                return (
                  <div key={group.id} className="rounded-xl overflow-hidden">
                    <div
                      className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2 text-xs rounded-xl transition ${
                        isActive
                          ? 'bg-emerald-600 text-white font-bold shadow-xs'
                          : 'font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectTab(singleSubItems[0]?.targetTab || singleItemInGroup.id)}
                        className="flex-1 flex items-center gap-2.5 min-w-0 text-left cursor-pointer"
                      >
                        <IconComp className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                        <span className="truncate">{group.label}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedNavId(isGroupExpanded ? null : group.id)}
                        className={`p-1.5 rounded-lg transition-transform cursor-pointer ${
                          isActive ? 'text-white hover:bg-white/20' : 'text-slate-400 hover:bg-slate-200/50'
                        }`}
                        aria-label={`Mở danh mục con của ${group.label}`}
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isGroupExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    {/* Sub-items list */}
                    {isGroupExpanded && (
                      <div className="pl-6 pr-2 py-1 space-y-1 bg-slate-50/70 dark:bg-slate-800/40 rounded-b-xl border-l-2 border-emerald-500 my-1 animate-in slide-in-from-top-1 duration-150">
                        {singleSubItems.map(sub => {
                          const SubIcon = resolveIcon(sub.iconName);
                          const isSubSelected = activeTab === sub.targetTab;
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => handleSelectTab(sub.targetTab)}
                              className={`w-full min-h-[40px] flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition cursor-pointer ${
                                isSubSelected
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-100 font-bold border border-emerald-300 dark:border-emerald-700'
                                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-400'}`} />
                                <span className="truncate">{sub.label}</span>
                              </div>
                              {sub.badge && (
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold shrink-0 ${
                                  sub.badgeColor || 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}>
                                  {sub.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Case 3: Multiple items in group
              const isAnyActive = itemsInGroup.some(item => activeTab === item.id);

              return (
                <div key={group.id} className="rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedNavId(isGroupExpanded ? null : group.id)}
                    className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2 text-xs rounded-xl font-bold transition cursor-pointer ${
                      isAnyActive
                        ? 'bg-slate-800 text-emerald-300 border border-emerald-700/50 shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <GroupIcon className={`w-4 h-4 shrink-0 ${isAnyActive ? 'text-emerald-300' : 'text-emerald-600 dark:text-emerald-400'}`} />
                      <span className="truncate">{group.label}</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isGroupExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Multiple items list */}
                  {isGroupExpanded && (
                    <div className="pl-6 pr-2 py-1 space-y-1 bg-slate-50/70 dark:bg-slate-800/40 rounded-b-xl border-l-2 border-emerald-500 my-1 animate-in slide-in-from-top-1 duration-150">
                      {itemsInGroup.map(item => {
                        const IconComp = resolveIcon(item.iconName);
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectTab(item.id)}
                            className={`w-full min-h-[40px] flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition cursor-pointer ${
                              isActive
                                ? 'bg-emerald-600 text-white font-bold'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <IconComp className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                              <span className="truncate">{item.label}</span>
                            </div>
                            {item.badge && (
                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold shrink-0 uppercase ${
                                isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                              }`}>
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
};

export default MobileNavigationDrawer;

