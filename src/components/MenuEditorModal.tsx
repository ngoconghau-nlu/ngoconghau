import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CustomNavItem, SystemTermItem, SystemTermCategory, Organization, Sv5tStandardGroup } from '../types';
import { ORGANIZATIONS_LIST } from '../data/mockData';
import {
  Settings2,
  X,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  ExternalLink,
  BarChart3,
  Calendar,
  Award,
  FileText,
  Building2,
  Key,
  History,
  HardDrive,
  Sparkles,
  Link,
  Shield,
  Layers,
  BookOpen,
  Search,
  CheckCircle2,
  Edit3,
  Tag,
  AlertCircle,
  HelpCircle,
  Sliders,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Users
} from 'lucide-react';
import { AVAILABLE_ICON_NAMES, resolveIcon, CANONICAL_NAVIGATION_CONFIG } from '../config/navigationConfig';
import { ProofCatalogSection } from './ProofCatalogSection';

interface MenuEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: TabType;
}

type TabType =
  | 'annual_awards'
  | 'research_awards'
  | 'position_roles'
  | 'party_mentor'
  | 'menu'
  | 'dictionary'
  | 'organizations'
  | 'scales'
  | 'drl'
  | 'sv5t'
  | 'hoi'
  | 'doan';

const CATEGORY_LABELS: Record<SystemTermCategory, { label: string; color: string }> = {
  TITLES_DESCRIPTIONS: { label: 'Tiêu Đề & Mô Tả Trang', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800' },
  SYSTEM_NOTICES: { label: 'Thông Báo & Ghi Chú System', color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800' },
  SECTION_LABELS: { label: 'Thẻ Nhãn & Bảng Biểu', color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800' },
  CERTIFICATES_REPORTS: { label: 'Báo Cáo & Chứng Nhận', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800' },
  ORGANIZATION: { label: 'Tổ Chức & Đơn Vị', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800' },
  SCORE_EMULATION: { label: 'Thi Đua & Điểm Rèn Luyện', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800' },
  ACTIVITIES: { label: 'Hoạt Động Phong Trào', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' },
  SYSTEM_ROLES: { label: 'Phân Quyền Tài Khoản', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800' },
  GENERAL: { label: 'Giao Diện & Danh Mục Chung', color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' }
};

export const MenuEditorModal: React.FC<MenuEditorModalProps> = ({ isOpen, onClose, initialTab }) => {
  const {
    customNavItems,
    updateCustomNavItems,
    resetCustomNavItems,
    systemTerms,
    updateSystemTerms,
    resetSystemTerms,
    organizations,
    updateOrganizations,
    targetScaleConfig,
    updateTargetScaleConfig,
    resetTargetScaleConfig,
    drlCriteria,
    updateDrlCriteria,
    resetDrlCriteria,
    sv5tStandards,
    updateSv5tStandards,
    resetSv5tStandards,
    hoiPrograms,
    updateHoiPrograms,
    resetHoiPrograms,
    doanPrograms,
    updateDoanPrograms,
    resetDoanPrograms,
    annualAwardsCatalog,
    updateAnnualAwardsCatalog,
    researchAwardsCatalog,
    updateResearchAwardsCatalog,
    positionRolesCatalog,
    updatePositionRolesCatalog,
    partyMentorCatalog,
    updatePartyMentorCatalog,
    resetProofCatalogs,
    setActiveTab: setGlobalActiveTab,
    user,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'menu');
  const tabsScrollRef = React.useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsScrollRef.current) {
      tabsScrollRef.current.scrollBy({
        left: direction === 'left' ? -240 : 240,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Menu Tab States
  const [menuItems, setMenuItems] = useState<CustomNavItem[]>([]);

  // Dictionary Tab States
  const [termItems, setTermItems] = useState<SystemTermItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Organizations Tab States
  const [orgsList, setOrgsList] = useState<Organization[]>([]);
  const [orgSearch, setOrgSearch] = useState('');

  // Scales Tab States
  const [scalesList, setScalesList] = useState<Array<{ id: number; name: string; points: number }>>([]);

  // DRL Tab States
  const [drlList, setDrlList] = useState<Array<{ id: string; title: string }>>([]);

  // SV5T Tab States
  const [sv5tList, setSv5tList] = useState<Array<Sv5tStandardGroup>>([]);

  // Hoi Tab States
  const [hoiList, setHoiList] = useState<Array<{ id: string; title: string }>>([]);

  // Doan Tab States
  const [doanList, setDoanList] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    if (isOpen) {
      setMenuItems(JSON.parse(JSON.stringify(customNavItems)));
      setTermItems(JSON.parse(JSON.stringify(systemTerms)));
      setOrgsList(JSON.parse(JSON.stringify(organizations)));
      setScalesList(JSON.parse(JSON.stringify(targetScaleConfig)));
      setDrlList(JSON.parse(JSON.stringify(drlCriteria)));
      setSv5tList(JSON.parse(JSON.stringify(sv5tStandards)));
      setHoiList(JSON.parse(JSON.stringify(hoiPrograms)));
      setDoanList(JSON.parse(JSON.stringify(doanPrograms)));
    }
  }, [isOpen, customNavItems, systemTerms, organizations, targetScaleConfig, drlCriteria, sv5tStandards, hoiPrograms, doanPrograms]);

  // Filtered dictionary list
  const filteredTerms = useMemo(() => {
    return termItems.filter(item => {
      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.originalText.toLowerCase().includes(q) ||
        item.customText.toLowerCase().includes(q) ||
        item.key.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [termItems, selectedCategory, searchTerm]);

  const customizedCount = useMemo(() => {
    return termItems.filter(t => t.customText && t.customText.trim() !== t.originalText.trim()).length;
  }, [termItems]);

  const filteredOrgs = useMemo(() => {
    const q = orgSearch.toLowerCase().trim();
    if (!q) return orgsList;
    return orgsList.filter(o => o.code.toLowerCase().includes(q) || o.name.toLowerCase().includes(q) || o.hostLevelName.toLowerCase().includes(q));
  }, [orgsList, orgSearch]);

  if (!isOpen) return null;

  // Level 4 Check
  const isLevel4 = user?.currentRole?.roleLevel === 4;
  if (!isLevel4) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
            <X className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-white text-sm">Thẩm Quyền Giới Hạn</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Chức năng quản lý danh mục và cấu hình hệ thống chỉ dành cho tài khoản Cấp Trường (Cấp 4).
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition w-full cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  // --- SAVE & RESET ALL HANDLERS ---
  const handleSaveAll = () => {
    if (activeTab === 'menu') {
      updateCustomNavItems(menuItems);
      showToast('Đã lưu cấu hình Menu điều hướng!', 'success');
    } else if (activeTab === 'dictionary') {
      updateSystemTerms(termItems);
      showToast('Đã lưu từ ngữ hệ thống!', 'success');
    } else if (activeTab === 'organizations') {
      updateOrganizations(orgsList);
      showToast('Đã lưu danh mục Đơn vị tổ chức & Điểm cấp đăng cai!', 'success');
    } else if (activeTab === 'scales') {
      updateTargetScaleConfig(scalesList);
      showToast('Đã lưu quy mô đối tượng tham gia (Thành phần 1)!', 'success');
    } else if (activeTab === 'drl') {
      updateDrlCriteria(drlList);
      showToast('Đã lưu tiêu chí Điểm Rèn Luyện (C.11)!', 'success');
    } else if (activeTab === 'sv5t') {
      updateSv5tStandards(sv5tList);
      showToast('Đã lưu tiêu chuẩn Sinh viên 5 Tốt (C.12)!', 'success');
    } else if (activeTab === 'hoi') {
      updateHoiPrograms(hoiList);
      showToast('Đã lưu mảng công tác Hội (C.13)!', 'success');
    } else if (activeTab === 'doan') {
      updateDoanPrograms(doanList);
      showToast('Đã lưu mảng công tác Đoàn (C.14)!', 'success');
    }
    onClose();
  };

  const handleResetCurrentTab = () => {
    if (activeTab === 'menu') {
      if (window.confirm('Khôi phục Menu điều hướng về mặc định?')) {
        resetCustomNavItems();
        onClose();
      }
    } else if (activeTab === 'dictionary') {
      if (window.confirm('Khôi phục từ ngữ hệ thống về mặc định?')) {
        resetSystemTerms();
        onClose();
      }
    } else if (activeTab === 'organizations') {
      if (window.confirm('Khôi phục 53 đơn vị tổ chức về mặc định?')) {
        updateOrganizations(ORGANIZATIONS_LIST);
        showToast('Đã khôi phục danh mục đơn vị ban đầu!', 'info');
        setOrgsList(JSON.parse(JSON.stringify(ORGANIZATIONS_LIST)));
      }
    } else if (activeTab === 'scales') {
      if (window.confirm('Khôi phục quy mô đối tượng về mặc định?')) {
        resetTargetScaleConfig();
        showToast('Đã khôi phục quy mô đối tượng ban đầu!', 'info');
        setScalesList(JSON.parse(JSON.stringify(targetScaleConfig)));
      }
    } else if (activeTab === 'drl') {
      if (window.confirm('Khôi phục tiêu chí Điểm Rèn Luyện về mặc định?')) {
        resetDrlCriteria();
        showToast('Đã khôi phục tiêu chí ĐRL ban đầu!', 'info');
      }
    } else if (activeTab === 'sv5t') {
      if (window.confirm('Khôi phục tiêu chuẩn Sinh viên 5 Tốt về mặc định?')) {
        resetSv5tStandards();
        showToast('Đã khôi phục tiêu chuẩn SV5T ban đầu!', 'info');
      }
    } else if (activeTab === 'hoi') {
      if (window.confirm('Khôi phục mảng công tác Hội về mặc định?')) {
        resetHoiPrograms();
        showToast('Đã khôi phục mảng CT Hội ban đầu!', 'info');
      }
    } else if (activeTab === 'doan') {
      if (window.confirm('Khôi phục mảng công tác Đoàn về mặc định?')) {
        resetDoanPrograms();
        showToast('Đã khôi phục mảng CT Đoàn ban đầu!', 'info');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-900/75 backdrop-blur-xs p-0 sm:p-6 flex flex-col justify-end sm:justify-center items-center">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] my-0 sm:my-auto shrink-0">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-amber-300" />
              Quản Lý Cấu Hình & Danh Mục Hệ Thống (Cấp Trường - Cấp 4)
            </h3>
            <p className="text-xs text-emerald-100 mt-0.5">
              Hợp nhất: Khen thưởng hằng năm, NCKH, Chức vụ, Đảng viên HD, Menu, Từ ngữ, Đơn vị, Quy mô, ĐRL, SV5T, Đoàn & Hội
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                setGlobalActiveTab('system-catalogs');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-emerald-100 hover:text-white font-bold text-xs transition border border-white/20 cursor-pointer"
              title="Mở toàn màn hình Quản Lý Quy Điểm & Danh Mục"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mở Toàn Màn Hình</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Floating, Elevated Tab Navigation Bar (Nổi, Thuận tiện, Không bị che) */}
        <div className="sticky top-0 z-30 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 px-3 sm:px-5 py-2.5 flex items-center justify-between gap-1.5 shrink-0 shadow-xs">
          {/* Scroll Left Button (Always convenient on smaller viewports) */}
          <button
            type="button"
            onClick={() => scrollTabs('left')}
            className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0"
            title="Cuộn sang trái"
            aria-label="Cuộn danh mục tab sang trái"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Floating Tabs Scroll Track */}
          <div
            ref={tabsScrollRef}
            role="tablist"
            className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-1 px-1 flex-1 min-w-0 scroll-smooth"
          >
            {[
              { id: 'annual_awards', num: '1', label: 'Khen Thưởng Hằng Năm', icon: Award, badge: 'Cấp 4', desc: 'Khung điểm khen thưởng TW, Thành, Trường, Khoa' },
              { id: 'research_awards', num: '2', label: 'Khen Thưởng NCKH', icon: BookOpen, badge: 'Cấp 4', desc: 'Khung điểm Euréka, bài báo khoa học, đề tài NCKH' },
              { id: 'position_roles', num: '3', label: 'Chức Vụ Đoàn - Hội', icon: Briefcase, badge: 'Cấp 4', desc: 'Khung điểm cán bộ Bí thư, Lớp trưởng, BCH' },
              { id: 'party_mentor', num: '4', label: 'Đảng Viên Hướng Dẫn', icon: Users, badge: 'Cấp 4', desc: 'Khung điểm đảng viên HD phát triển Đảng, ĐV ưu tú' },
              { id: 'menu', num: '5', label: 'Menu Điều Hướng', icon: Layers, badge: 'Phân hệ', desc: 'Thứ tự và phân quyền menu chính' },
              { id: 'dictionary', num: '6', label: 'Từ Ngữ Hệ Thống', icon: BookOpen, badge: 'Cụm từ', desc: 'Thuật ngữ, tiêu đề & thông báo' },
              { id: 'organizations', num: '7', label: 'Đơn Vị Tổ Chức', icon: Building2, badge: '53 NLU', desc: 'Danh mục 53 đơn vị Đoàn - Hội' },
              { id: 'scales', num: '8', label: 'Quy Mô Tham Gia', icon: Sliders, badge: '1-6 điểm', desc: 'Quy mô & điểm cấp đăng cai' },
              { id: 'drl', num: '9', label: 'Tiêu Chí ĐRL', icon: Award, badge: 'C.11', desc: 'Tiêu chí đánh giá Điểm Rèn Luyện' },
              { id: 'sv5t', num: '10', label: 'Tiêu Chuẩn SV5T', icon: CheckSquare, badge: 'C.12', desc: 'Tiêu chuẩn xét chọn Sinh viên 5 Tốt' },
              { id: 'hoi', num: '11', label: 'Mảng CT Hội', icon: FileText, badge: 'C.13', desc: 'Mảng công tác Hội Sinh viên' },
              { id: 'doan', num: '12', label: 'Mảng CT Đoàn', icon: FileText, badge: 'C.14', desc: 'Mảng công tác Đoàn Thanh niên' },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  title={`${tab.num}. ${tab.label} (${tab.badge}): ${tab.desc}`}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`group relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 select-none ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 font-extrabold border border-emerald-300/90 dark:border-emerald-600/80 shadow-md shadow-emerald-950/10 dark:shadow-black/50 ring-2 ring-emerald-500/20 scale-[1.02]'
                      : 'bg-white/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold border border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:shadow-xs hover:scale-[1.01]'
                  }`}
                >
                  {/* Number Badge */}
                  <span className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-mono font-black shrink-0 transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950 group-hover:text-emerald-700 dark:group-hover:text-emerald-300'
                  }`}>
                    {tab.num}
                  </span>

                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`} />

                  <span className="leading-none">{tab.label}</span>

                  {/* Badge */}
                  <span className={`text-[9.5px] px-1.5 py-0.5 rounded-md font-mono font-bold shrink-0 ${
                    isActive
                      ? 'bg-emerald-100 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
                      : 'bg-slate-100 dark:bg-slate-700/70 text-slate-500 dark:text-slate-400'
                  }`}>
                    {tab.badge}
                  </span>

                  {/* Active Pulse Glow Indicator */}
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0 animate-pulse ml-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Scroll Right Button */}
          <button
            type="button"
            onClick={() => scrollTabs('right')}
            className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0"
            title="Cuộn sang phải"
            aria-label="Cuộn danh mục tab sang phải"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-5 text-xs overflow-y-auto flex-1">
          {/* ================= TAB 1: MENU ================= */}
          {activeTab === 'menu' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200">
                <strong>Cấu trúc Menu:</strong> Sắp xếp thứ tự hoặc đổi tên hiển thị các mục menu chính.
              </div>
              <div className="space-y-2">
                {menuItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between gap-3 group/row transition-all hover:border-emerald-300 dark:hover:border-emerald-700"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.altKey && e.key === 'ArrowUp') {
                        e.preventDefault();
                        if (idx > 0) {
                          const next = [...menuItems];
                          const temp = next[idx];
                          next[idx] = next[idx - 1];
                          next[idx - 1] = temp;
                          next.forEach((it, i) => { it.order = i + 1; });
                          setMenuItems(next);
                        }
                      } else if (e.altKey && e.key === 'ArrowDown') {
                        e.preventDefault();
                        if (idx < menuItems.length - 1) {
                          const next = [...menuItems];
                          const temp = next[idx];
                          next[idx] = next[idx + 1];
                          next[idx + 1] = temp;
                          next.forEach((it, i) => { it.order = i + 1; });
                          setMenuItems(next);
                        }
                      }
                    }}
                  >
                    {/* Reorder Buttons & Index */}
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => {
                            if (idx > 0) {
                              const next = [...menuItems];
                              const temp = next[idx];
                              next[idx] = next[idx - 1];
                              next[idx - 1] = temp;
                              next.forEach((it, i) => { it.order = i + 1; });
                              setMenuItems(next);
                            }
                          }}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition"
                          title="Di chuyển lên trên (Alt + Mũi tên lên)"
                          aria-label={`Di chuyển ${item.label} lên trên`}
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === menuItems.length - 1}
                          onClick={() => {
                            if (idx < menuItems.length - 1) {
                              const next = [...menuItems];
                              const temp = next[idx];
                              next[idx] = next[idx + 1];
                              next[idx + 1] = temp;
                              next.forEach((it, i) => { it.order = i + 1; });
                              setMenuItems(next);
                            }
                          }}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition"
                          title="Di chuyển xuống dưới (Alt + Mũi tên xuống)"
                          aria-label={`Di chuyển ${item.label} xuống dưới`}
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                    </div>

                    {/* Icon Preview & Icon Selector */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                        {React.createElement(resolveIcon(item.iconName), { className: 'w-4 h-4' })}
                      </div>
                      <select
                        value={item.iconName || 'Link'}
                        onChange={e => {
                          const next = [...menuItems];
                          next[idx].iconName = e.target.value;
                          setMenuItems(next);
                        }}
                        className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-medium max-w-[110px]"
                        title="Chọn biểu tượng hiển thị"
                        aria-label={`Chọn biểu tượng cho ${item.label}`}
                      >
                        {AVAILABLE_ICON_NAMES.map(ic => (
                          <option key={ic} value={ic}>
                            {ic}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Label Input */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <input
                        type="text"
                        value={item.label}
                        onChange={e => {
                          const next = [...menuItems];
                          next[idx].label = e.target.value;
                          setMenuItems(next);
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-semibold text-slate-900 dark:text-white text-xs"
                        placeholder="Tên hiển thị menu..."
                      />
                    </div>

                    {/* Controls: Permission & Visibility */}
                    <div className="flex items-center gap-2 shrink-0">
                      {(() => {
                        const canonical = CANONICAL_NAVIGATION_CONFIG.find(c => c.id === item.id);
                        const canonicalMin = canonical?.minLevel ?? 0;
                        const currentVal = Math.max(canonicalMin, item.minLevel ?? canonicalMin);
                        return (
                          <div className="flex items-center gap-1">
                            <select
                              value={currentVal}
                              onChange={e => {
                                const next = [...menuItems];
                                next[idx].minLevel = Math.max(canonicalMin, Number(e.target.value));
                                setMenuItems(next);
                              }}
                              className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-medium"
                              title={`Cấp bậc phân quyền tối thiểu (Bảo mật quy chuẩn: Tối thiểu Cấp ${canonicalMin})`}
                              aria-label={`Phân quyền tối thiểu cho ${item.label}`}
                            >
                              {canonicalMin <= 0 && <option value={0}>Cấp 0 (Khách)</option>}
                              {canonicalMin <= 1 && <option value={1}>Cấp 1 (SV)</option>}
                              {canonicalMin <= 2 && <option value={2}>Cấp 2 (Chi đoàn)</option>}
                              {canonicalMin <= 3 && <option value={3}>Cấp 3 (Khoa)</option>}
                              <option value={4}>Cấp 4 (Trường)</option>
                            </select>
                            {canonicalMin > 0 && (
                              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800" title="Mức quyền tối thiểu được bảo vệ">
                                ≥L{canonicalMin}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...menuItems];
                          next[idx].visible = !next[idx].visible;
                          setMenuItems(next);
                        }}
                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
                          item.visible
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'
                        }`}
                        title={item.visible ? 'Đang hiển thị (Nhấp để ẩn)' : 'Đang ẩn (Nhấp để hiển thị)'}
                        aria-label={`Trạng thái hiển thị của ${item.label}`}
                      >
                        {item.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 2: DICTIONARY ================= */}
          {activeTab === 'dictionary' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm từ ngữ, nhãn..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                >
                  <option value="ALL">Tất cả danh mục</option>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                {filteredTerms.map((term, idx) => (
                  <div key={term.id} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{term.originalText}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({term.key})</span>
                      </div>
                      <input
                        type="text"
                        value={term.customText}
                        onChange={e => {
                          const next = [...termItems];
                          const realIdx = termItems.findIndex(t => t.id === term.id);
                          if (realIdx !== -1) {
                            next[realIdx].customText = e.target.value;
                            setTermItems(next);
                          }
                        }}
                        className="w-full px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold text-emerald-800 dark:text-emerald-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 3: ORGANIZATIONS (53 đơn vị NLU & Điểm cấp đăng cai) ================= */}
          {activeTab === 'organizations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={orgSearch}
                    onChange={e => setOrgSearch(e.target.value)}
                    placeholder="Tìm theo mã đơn vị, tên khoa, CLB..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newCode = `ORG_${Date.now().toString().slice(-4)}`;
                    const newOrg: Organization = {
                      id: orgsList.length + 1,
                      code: newCode,
                      name: 'Đơn vị mới tạo',
                      type: 'KHOA',
                      hostLevel: 'A',
                      hostLevelName: 'Khoa & Đơn vị trực thuộc',
                      hostLevelScorePoint: 4,
                      email1: 'nlu@hcmuaf.edu.vn'
                    };
                    setOrgsList([newOrg, ...orgsList]);
                    showToast('Đã thêm đơn vị mới. Nhập thông tin và lưu lại!', 'info');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 text-white font-bold rounded-xl shadow-xs hover:bg-emerald-800 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Đơn Vị Mới</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
                {filteredOrgs.map((org, index) => (
                  <div key={org.code + index} className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2 shadow-2xs">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Mã Đơn Vị</label>
                        <input
                          type="text"
                          value={org.code}
                          onChange={e => {
                            const next = [...orgsList];
                            next[index].code = e.target.value;
                            setOrgsList(next);
                          }}
                          className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono font-bold"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Tên Đơn Vị / Khoa / CLB</label>
                        <input
                          type="text"
                          value={org.name}
                          onChange={e => {
                            const next = [...orgsList];
                            next[index].name = e.target.value;
                            setOrgsList(next);
                          }}
                          className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Loại Tổ Chức</label>
                        <select
                          value={org.type}
                          onChange={e => {
                            const next = [...orgsList];
                            next[index].type = e.target.value as any;
                            setOrgsList(next);
                          }}
                          className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-semibold"
                        >
                          <option value="TRUONG">Trường</option>
                          <option value="KHOA">Khoa / Ban</option>
                          <option value="CLB_TRUONG">CLB Trường</option>
                          <option value="CLB_KHOA">CLB Khoa</option>
                          <option value="CHI_DOAN">Chi Đoàn</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100 dark:border-slate-700/50">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Cấp Đăng Cai (A / B)</label>
                        <select
                          value={org.hostLevel}
                          onChange={e => {
                            const next = [...orgsList];
                            next[index].hostLevel = e.target.value as 'A' | 'B';
                            next[index].hostLevelScorePoint = e.target.value === 'A' ? 6 : 4;
                            setOrgsList(next);
                          }}
                          className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold text-emerald-700"
                        >
                          <option value="A">Cấp A (Đoàn Trường / Đơn vị lớn)</option>
                          <option value="B">Cấp B (Khoa / CLB / Chi đoàn)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Điểm Cấp Đăng Cai (Thành phần 3: 1-6)</label>
                        <input
                          type="number"
                          min={1}
                          max={6}
                          value={org.hostLevelScorePoint || 3}
                          onChange={e => {
                            const next = [...orgsList];
                            next[index].hostLevelScorePoint = Number(e.target.value);
                            setOrgsList(next);
                          }}
                          className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono font-bold"
                        />
                      </div>
                      <div className="flex items-end justify-between">
                        <div className="flex-1 mr-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">Email Liên Hệ</label>
                          <input
                            type="email"
                            value={org.email1}
                            onChange={e => {
                              const next = [...orgsList];
                              next[index].email1 = e.target.value;
                              setOrgsList(next);
                            }}
                            className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setOrgsList(orgsList.filter((_, i) => i !== index));
                            showToast('Đã xóa đơn vị khỏi danh sách!', 'info');
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                          title="Xóa đơn vị này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 4: SCALES (Quy mô đối tượng tham gia - Thành phần 1: 1-6 điểm) ================= */}
          {activeTab === 'scales' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-200">
                <strong>Thành phần 1: Quy mô đối tượng tham gia (1 - 6 điểm).</strong> Chỉnh sửa tên quy mô hoặc điểm quy đổi cho từng cấp độ.
              </div>
              <div className="space-y-2">
                {scalesList.map((scale, index) => (
                  <div key={scale.id} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono font-bold flex items-center justify-center shrink-0">
                      {scale.points}đ
                    </span>
                    <input
                      type="text"
                      value={scale.name}
                      onChange={e => {
                        const next = [...scalesList];
                        next[index].name = e.target.value;
                        setScalesList(next);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-semibold"
                    />
                    <div className="w-24 shrink-0">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Điểm (1-6)</label>
                      <input
                        type="number"
                        min={1}
                        max={6}
                        value={scale.points}
                        onChange={e => {
                          const next = [...scalesList];
                          next[index].points = Number(e.target.value);
                          setScalesList(next);
                        }}
                        className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono font-bold text-center"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 5: DRL (11. Tiêu chí Điểm Rèn Luyện C.11) ================= */}
          {activeTab === 'drl' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-700 dark:text-slate-300">Danh mục Tiêu chí Điểm Rèn Luyện (C.11)</div>
                <button
                  type="button"
                  onClick={() => {
                    const newId = `C_${Date.now().toString().slice(-3)}`;
                    setDrlList([...drlList, { id: newId, title: `${newId}. Tiêu chí rèn luyện mới` }]);
                  }}
                  className="px-3 py-1.5 bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                >
                  + Thêm Tiêu Chí ĐRL
                </button>
              </div>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {drlList.map((item, index) => (
                  <div key={item.id} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-3">
                    <input
                      type="text"
                      value={item.id}
                      onChange={e => {
                        const next = [...drlList];
                        next[index].id = e.target.value;
                        setDrlList(next);
                      }}
                      className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono font-bold text-center"
                    />
                    <input
                      type="text"
                      value={item.title}
                      onChange={e => {
                        const next = [...drlList];
                        next[index].title = e.target.value;
                        setDrlList(next);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setDrlList(drlList.filter((_, i) => i !== index))}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 6: SV5T (12. Tiêu chuẩn Sinh viên 5 Tốt C.12) ================= */}
          {activeTab === 'sv5t' && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl text-indigo-900 dark:text-indigo-200">
                <strong>Tiêu chuẩn Sinh viên 5 Tốt (C.12).</strong> Quản lý các nhóm tiêu chuẩn (Đạo đức tốt, Học tập tốt, Thể lực tốt, Tình nguyện tốt, Hội nhập tốt).
              </div>
              <div className="space-y-4 max-h-[55vh] overflow-y-auto">
                {sv5tList.map((group, groupIdx) => (
                  <div key={group.id} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
                    <input
                      type="text"
                      value={group.name}
                      onChange={e => {
                        const next = [...sv5tList];
                        next[groupIdx].name = e.target.value;
                        setSv5tList(next);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-slate-900 font-bold text-emerald-900 dark:text-emerald-300 text-xs"
                    />
                    <div className="space-y-2 pl-2">
                      {group.criteria.map((crit: any, critIdx: number) => (
                        <div key={crit.id} className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-500 w-12 text-center">{crit.code}</span>
                          <input
                            type="text"
                            value={crit.title}
                            onChange={e => {
                              const next = [...sv5tList];
                              next[groupIdx].criteria[critIdx].title = e.target.value;
                              setSv5tList(next);
                            }}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 7: HOI (13. Mảng CT Hội C.13) ================= */}
          {activeTab === 'hoi' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-700 dark:text-slate-300">Mảng Công Tác Hội & Phong Trào Sinh Viên (C.13)</div>
                <button
                  type="button"
                  onClick={() => {
                    const newId = `${hoiList.length + 1}`;
                    setHoiList([...hoiList, { id: newId, title: `Chương trình Hội số ${newId}` }]);
                  }}
                  className="px-3 py-1.5 bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                >
                  + Thêm Mảng CT Hội
                </button>
              </div>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {hoiList.map((item, index) => (
                  <div key={item.id} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-3">
                    <input
                      type="text"
                      value={item.id}
                      onChange={e => {
                        const next = [...hoiList];
                        next[index].id = e.target.value;
                        setHoiList(next);
                      }}
                      className="w-16 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono font-bold text-center"
                    />
                    <input
                      type="text"
                      value={item.title}
                      onChange={e => {
                        const next = [...hoiList];
                        next[index].title = e.target.value;
                        setHoiList(next);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setHoiList(hoiList.filter((_, i) => i !== index))}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 8: DOAN (14. Mảng CT Đoàn C.14) ================= */}
          {activeTab === 'doan' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-700 dark:text-slate-300">Mảng Công Tác Đoàn & Phong Trào TT (C.14)</div>
                <button
                  type="button"
                  onClick={() => {
                    const newId = `KR${doanList.length + 1}.1`;
                    setDoanList([...doanList, { id: newId, title: `${newId}. Mảng công tác Đoàn mới` }]);
                  }}
                  className="px-3 py-1.5 bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                >
                  + Thêm Mảng CT Đoàn
                </button>
              </div>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {doanList.map((item, index) => (
                  <div key={item.id} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-3">
                    <input
                      type="text"
                      value={item.id}
                      onChange={e => {
                        const next = [...doanList];
                        next[index].id = e.target.value;
                        setDoanList(next);
                      }}
                      className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono font-bold text-center"
                    />
                    <input
                      type="text"
                      value={item.title}
                      onChange={e => {
                        const next = [...doanList];
                        next[index].title = e.target.value;
                        setDoanList(next);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setDoanList(doanList.filter((_, i) => i !== index))}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetCurrentTab}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi Phục Mặc Định Tab Này</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Thay Đổi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
