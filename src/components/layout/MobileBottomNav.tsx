import React from 'react';
import {
  BarChart3,
  Calendar,
  Award,
  FileText,
  Menu
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface MobileBottomNavProps {
  onOpenMobileDrawer: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenMobileDrawer }) => {
  const { activeTab, setActiveTab } = useApp();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Tổng Quan',
      icon: BarChart3,
      targetTab: 'dashboard'
    },
    {
      id: 'activities',
      label: 'Hoạt Động',
      icon: Calendar,
      targetTab: 'activities'
    },
    {
      id: 'student-portal',
      label: 'Cổng SV',
      icon: Award,
      targetTab: 'student-portal'
    },
    {
      id: 'score-roster',
      label: 'Sổ Điểm',
      icon: FileText,
      targetTab: 'score-roster'
    }
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 shadow-lg px-2 py-1 flex items-center justify-around safe-area-pb"
      aria-label="Thanh điều hướng di động chính"
    >
      {navItems.map(item => {
        const IconComp = item.icon;
        const isActive =
          activeTab === item.targetTab ||
          (item.targetTab === 'student-portal' && activeTab === 'portal-sv5t') ||
          (item.targetTab === 'activities' && activeTab === 'activities');

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.targetTab)}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 rounded-xl transition-all cursor-pointer active:scale-90 ${
              isActive
                ? 'text-emerald-700 dark:text-emerald-400 font-extrabold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title={item.label}
          >
            <div className="relative">
              <IconComp className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 font-bold truncate max-w-[64px]">
              {item.label}
            </span>
          </button>
        );
      })}

      {/* 5th Button: Open Full Navigation & Tools Drawer */}
      <button
        type="button"
        onClick={onOpenMobileDrawer}
        className="flex flex-col items-center justify-center min-w-[56px] min-h-[48px] px-2 py-1 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer active:scale-90"
        title="Mở menu tính năng & công cụ"
        aria-label="Mở menu công cụ"
      >
        <Menu className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <span className="text-[10px] tracking-tight mt-0.5 font-bold text-emerald-700 dark:text-emerald-400">
          Menu
        </span>
      </button>
    </nav>
  );
};

export default MobileBottomNav;
