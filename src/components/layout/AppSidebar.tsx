import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Lock,
  LogOut,
  User,
  PanelLeftClose,
  PanelLeft,
  Edit2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  CANONICAL_NAVIGATION_CONFIG,
  NAVIGATION_GROUPS,
  getEffectiveNavItems,
  resolveIcon,
  NavigationItemConfig
} from '../../config/navigationConfig';
import { CustomNavItem } from '../../types';
import { UserProfileMenu } from '../header/UserProfileMenu';

interface AppSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenMenuEditor: (tab?: string) => void;
  onOpenLogoEditor: () => void;
  onOpenBackup: () => void;
  onOpenTrash: () => void;
  onOpenHelp: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  onOpenMenuEditor,
  onOpenLogoEditor,
  onOpenBackup,
  onOpenTrash,
  onOpenHelp
}) => {
  const { activeTab, setActiveTab, customNavItems, user, headerBranding } = useApp();
  const userRoleLevel = user.currentRole.roleLevel ?? 0;
  const isLevel4 = userRoleLevel === 4;

  const handleNavSelect = (targetTab: string) => {
    if (targetTab === 'system-ui-branding') {
      onOpenLogoEditor();
    } else if (targetTab === 'system-backup') {
      onOpenBackup();
    } else if (targetTab === 'system-trash') {
      onOpenTrash();
    } else if (targetTab === 'system-help') {
      onOpenHelp();
    } else {
      setActiveTab(targetTab);
    }
  };

  // Track expanded accordion submenus by nav item ID
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    UTILITIES: true,
    OVERVIEW: true,
    targets: true,
    activities: true,
    'student-portal': true,
    'score-roster': true
  });

  // Effective nav items filtered strictly by user role level and visibility
  const effectiveNavItems = React.useMemo(() => {
    return getEffectiveNavItems(customNavItems, userRoleLevel);
  }, [customNavItems, userRoleLevel]);

  // Auto-expand group containing activeTab
  useEffect(() => {
    const activeItem = effectiveNavItems.find(item =>
      item.id === activeTab || item.subItems?.some(sub => sub.targetTab === activeTab)
    );
    if (activeItem?.group) {
      setExpandedGroups(prev => ({
        ...prev,
        [activeItem.group]: true
      }));
    }
  }, [activeTab, effectiveNavItems]);

  const toggleGroup = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Group items by canonical groups
  const groupedItems = React.useMemo(() => {
    const map = new Map<string, NavigationItemConfig[]>();
    NAVIGATION_GROUPS.forEach(g => map.set(g.id, []));

    effectiveNavItems.forEach(item => {
      const groupKey = item.group || 'OVERVIEW';
      const list = map.get(groupKey) || [];
      list.push(item);
      map.set(groupKey, list);
    });

    return map;
  }, [effectiveNavItems]);

  return (
    <aside
      className={`hidden lg:flex flex-col bg-gradient-to-b from-emerald-950 via-emerald-900 to-green-950 text-emerald-100 border-r border-emerald-800/80 transition-all duration-300 ease-in-out shrink-0 sticky top-0 h-screen z-40 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
      aria-label="Thanh điều hướng chính"
    >
      {/* Sidebar Header: Logo Cluster & Branding */}
      <div className="h-16 px-3.5 flex items-center justify-between border-b border-emerald-800/80 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2.5 text-left overflow-hidden group cursor-pointer"
          title="Trang chủ Dashboard NLU Youth 2026"
        >
          {headerBranding?.logoUrl ? (
            <img
              src={headerBranding.logoUrl}
              alt="Logo"
              className="w-9 h-9 object-contain rounded-xl border border-slate-700 bg-slate-800 p-0.5 shadow-sm group-hover:scale-105 transition-transform shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-900/40 shrink-0 group-hover:scale-105 transition-transform">
              <span className="text-xs font-extrabold tracking-tighter">NLU</span>
            </div>
          )}

          {headerBranding?.secondaryLogoUrl && !isCollapsed && (
            <img
              src={headerBranding.secondaryLogoUrl}
              alt="Secondary Logo"
              className="w-8 h-8 object-contain rounded-lg border border-slate-700 bg-slate-800 p-0.5 shrink-0 group-hover:scale-105 transition-transform"
            />
          )}

          {!isCollapsed && (
            <div className="min-w-0 transition-opacity duration-200">
              <span className="font-black text-xs text-white tracking-tight block truncate group-hover:text-emerald-400 transition-colors">
                {headerBranding?.titleText || 'NLU YOUTH 2026'}
              </span>
              <span className="text-[9.5px] text-emerald-400 font-semibold tracking-wider uppercase block truncate">
                {headerBranding?.subtitleText || 'Đại Học Nông Lâm'}
              </span>
            </div>
          )}
        </button>

        <div className="flex items-center gap-1 shrink-0">
          {!isCollapsed && isLevel4 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenLogoEditor();
              }}
              className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-slate-800 transition cursor-pointer"
              title="Chỉnh sửa logo & nhận diện thương hiệu (Cấp 4)"
              aria-label="Chỉnh sửa logo"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Collapse Toggle Button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title={isCollapsed ? 'Mở rộng thanh menu' : 'Thu gọn thanh menu'}
          >
            {isCollapsed ? <PanelLeft className="w-4 h-4 text-emerald-400" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation Items */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-2.5 custom-scrollbar scrollbar-none">
        {NAVIGATION_GROUPS.map(group => {
          const rawItems = groupedItems.get(group.id) || [];
          const itemsInGroup = rawItems.filter((item, index, self) => index === self.findIndex(t => t.id === item.id));
          if (itemsInGroup.length === 0) return null;

          const isGroupExpanded = expandedGroups[group.id] !== false; // default open
          const GroupIcon = group.iconName ? resolveIcon(group.iconName) : Sparkles;
          const singleItemInGroup = itemsInGroup.length === 1 ? itemsInGroup[0] : null;
          const singleSubItems = singleItemInGroup?.subItems || [];

          // CASE 1: Group has 1 item with NO sub-items (Flat 1-level menu target, e.g. OVERVIEW)
          if (singleItemInGroup && singleSubItems.length === 0) {
            const IconComp = resolveIcon(singleItemInGroup.iconName || group.iconName);
            const isActive = activeTab === singleItemInGroup.id;

            return (
              <div key={group.id} className="relative group/item">
                <button
                  type="button"
                  onClick={() => handleNavSelect(singleItemInGroup.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-medium text-xs transition-all duration-150 text-left cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-hidden ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md shadow-emerald-950/50'
                      : 'text-emerald-200 hover:text-white hover:bg-emerald-800/70'
                  }`}
                  title={isCollapsed ? group.label : singleItemInGroup.description}
                >
                  <IconComp className={`w-4 h-4 shrink-0 transition-transform group-hover/item:scale-110 ${isActive ? 'text-white' : 'text-emerald-300'}`} />
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-1.5">
                      <span className="truncate font-bold">{group.label}</span>
                      {singleItemInGroup.badge && (
                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold shrink-0 uppercase tracking-wide ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-emerald-900/90 text-emerald-200 border border-emerald-700/80'
                        }`}>
                          {singleItemInGroup.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>

                {/* Tooltip for Collapsed Mode */}
                {isCollapsed && (
                  <div className="fixed left-20 ml-2 px-3 py-1.5 bg-emerald-950 text-emerald-100 text-xs font-semibold rounded-lg shadow-xl border border-emerald-700 opacity-0 pointer-events-none group-hover/item:opacity-100 transition-opacity z-50 whitespace-nowrap">
                    {group.label}
                    {singleItemInGroup.badge && <span className="ml-1.5 text-[10px] text-emerald-300 font-normal">({singleItemInGroup.badge})</span>}
                  </div>
                )}
              </div>
            );
          }

          // CASE 2: Group has 1 item with SUB-ITEMS (Consolidated Accordion Group, e.g. ACTIVITIES, STUDENT, EMULATION, TARGETS)
          if (singleItemInGroup && singleSubItems.length > 0) {
            const IconComp = resolveIcon(singleItemInGroup.iconName || group.iconName);
            const isSubActive = singleSubItems.some(sub => sub.targetTab === activeTab);
            const isDirectActive = activeTab === singleItemInGroup.id || isSubActive;

            return (
              <div key={group.id} className="space-y-1 relative group/item">
                {!isCollapsed ? (
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedGroups(prev => ({ ...prev, [group.id]: !isGroupExpanded }));
                      const defaultTab = singleSubItems[0]?.targetTab || singleItemInGroup.id;
                      if (defaultTab && !isSubActive) setActiveTab(defaultTab);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-bold text-xs transition-all duration-150 text-left cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-hidden ${
                      isDirectActive
                        ? 'bg-emerald-800/80 text-emerald-100 border border-emerald-600/60 shadow-xs'
                        : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
                    }`}
                    aria-expanded={isGroupExpanded}
                    title={group.label}
                  >
                    <IconComp className={`w-4 h-4 shrink-0 ${isDirectActive ? 'text-white' : 'text-emerald-300'}`} />
                    <span className="flex-1 truncate">{group.label}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 shrink-0 text-emerald-300 transition-transform duration-200 ${
                        isGroupExpanded ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const defaultTab = singleSubItems[0]?.targetTab || singleItemInGroup.id;
                      if (defaultTab) setActiveTab(defaultTab);
                    }}
                    className={`w-full flex justify-center py-2 rounded-xl transition cursor-pointer ${
                      isDirectActive ? 'bg-emerald-600 text-white' : 'text-emerald-300 hover:text-white hover:bg-emerald-800'
                    }`}
                    title={group.label}
                  >
                    <IconComp className="w-4 h-4 shrink-0" />
                  </button>
                )}

                {/* Direct Sub-items List (Flat 1-layer accordion) */}
                {!isCollapsed && isGroupExpanded && (
                  <div className="ml-3 pl-2.5 border-l-2 border-emerald-800/80 mt-0.5 space-y-0.5 animate-in fade-in duration-150">
                    {singleSubItems.map(sub => {
                      const SubIcon = resolveIcon(sub.iconName);
                      const isSubTabActive = activeTab === sub.targetTab;

                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleNavSelect(sub.targetTab)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11.5px] transition-all text-left cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-hidden ${
                            isSubTabActive
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-xs'
                              : 'text-emerald-200/90 hover:text-white hover:bg-emerald-800/60'
                          }`}
                        >
                          <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubTabActive ? 'text-white' : 'text-emerald-300'}`} />
                          <span className="truncate flex-1">{sub.label}</span>
                          {sub.badge && (
                            <span className={`text-[8.5px] font-extrabold px-1.5 py-0.2 rounded shrink-0 uppercase ${
                              isSubTabActive ? 'bg-white/20 text-white' : 'bg-emerald-900 text-emerald-200 border border-emerald-700'
                            }`}>
                              {sub.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Tooltip for Collapsed Mode */}
                {isCollapsed && (
                  <div className="fixed left-20 ml-2 px-3 py-1.5 bg-emerald-950 text-emerald-100 text-xs font-semibold rounded-lg shadow-xl border border-emerald-700 opacity-0 pointer-events-none group-hover/item:opacity-100 transition-opacity z-50 whitespace-nowrap">
                    {group.label}
                  </div>
                )}
              </div>
            );
          }

          // CASE 3: Group has MULTIPLE items (Accordion Group, e.g. ORGANIZATION, SYSTEM)
          const isAnyChildActive = itemsInGroup.some(item => activeTab === item.id);

          return (
            <div key={group.id} className="space-y-1 relative group/item">
              {!isCollapsed ? (
                <button
                  type="button"
                  onClick={() => setExpandedGroups(prev => ({ ...prev, [group.id]: !isGroupExpanded }))}
                  className={`w-full px-2.5 py-1.5 flex items-center justify-between text-xs font-bold rounded-xl transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-hidden ${
                    isAnyChildActive
                      ? 'bg-emerald-800/80 text-emerald-100 border border-emerald-600/60'
                      : 'text-emerald-200 hover:text-white hover:bg-emerald-800/50'
                  }`}
                  aria-expanded={isGroupExpanded}
                >
                  <span className="flex items-center gap-2.5 truncate text-left">
                    <GroupIcon className={`w-4 h-4 shrink-0 ${isAnyChildActive ? 'text-white' : 'text-emerald-300'}`} />
                    <span className="truncate">{group.label}</span>
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 text-emerald-300 transition-transform duration-200 ${
                      isGroupExpanded ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const firstChild = itemsInGroup[0]?.id;
                    if (firstChild) handleNavSelect(firstChild);
                  }}
                  className={`w-full flex justify-center py-2 rounded-xl transition cursor-pointer ${
                    isAnyChildActive ? 'bg-emerald-600 text-white' : 'text-emerald-300 hover:text-white hover:bg-emerald-800'
                  }`}
                  title={group.label}
                >
                  <GroupIcon className="w-4 h-4 shrink-0" />
                </button>
              )}

              {/* Items List underneath */}
              {!isCollapsed && isGroupExpanded && (
                <div className="ml-3 pl-2.5 border-l-2 border-emerald-800/80 mt-0.5 space-y-0.5 animate-in fade-in duration-150">
                  {itemsInGroup.map(item => {
                    const IconComp = resolveIcon(item.iconName);
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNavSelect(item.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11.5px] transition-all duration-150 text-left cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-hidden ${
                          isActive
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-xs'
                            : 'text-emerald-200/90 hover:text-white hover:bg-emerald-800/60'
                        }`}
                        title={item.description}
                      >
                        <IconComp className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-emerald-300'}`} />
                        <span className="truncate flex-1">{item.label}</span>
                        {item.badge && (
                          <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-extrabold shrink-0 uppercase tracking-wide ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-emerald-900 text-emerald-200 border border-emerald-700'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Tooltip for Collapsed Mode */}
              {isCollapsed && (
                <div className="fixed left-20 ml-2 px-3 py-1.5 bg-emerald-950 text-emerald-100 text-xs font-semibold rounded-lg shadow-xl border border-emerald-700 opacity-0 pointer-events-none group-hover/item:opacity-100 transition-opacity z-50 whitespace-nowrap">
                  {group.label}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer: User Profile & SSO Control (Bottom Left) */}
      <div className="p-2.5 border-t border-emerald-800/80 bg-emerald-950/80 shrink-0">
        <UserProfileMenu
          direction="up"
          align="left"
          isSidebar={true}
          isCollapsed={isCollapsed}
        />
      </div>
    </aside>
  );
};
