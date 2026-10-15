import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { safeLocalStorageSetItem } from '../utils/safeStorage';
import {
  Organization,
  ParticipantRoleType,
  Sv5tStandardGroup,
  CustomNavItem,
  SystemTermItem,
  SystemTermCategory,
  ProgramPersonnelQuota
} from '../types';
import { DEFAULT_PROGRAM_PERSONNEL_QUOTAS } from '../data/mockData';
import { ProofCatalogSection } from './ProofCatalogSection';
import {
  Sliders,
  Building,
  Award,
  BookOpen,
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  Shield,
  Briefcase,
  Users,
  Layers,
  FileText,
  RotateCcw,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  CheckSquare
} from 'lucide-react';
import {
  AVAILABLE_ICON_NAMES,
  resolveIcon,
  CANONICAL_NAVIGATION_CONFIG
} from '../config/navigationConfig';

const CATEGORY_LABELS: Record<SystemTermCategory, { label: string; color: string }> = {
  TITLES_DESCRIPTIONS: {
    label: 'Tiêu Đề & Mô Tả Trang',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800'
  },
  SYSTEM_NOTICES: {
    label: 'Thông Báo & Ghi Chú System',
    color: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
  },
  SECTION_LABELS: {
    label: 'Thẻ Nhãn & Bảng Biểu',
    color: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800'
  },
  CERTIFICATES_REPORTS: {
    label: 'Báo Cáo & Chứng Nhận',
    color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
  },
  ORGANIZATION: {
    label: 'Tổ Chức & Đơn Vị',
    color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
  },
  SCORE_EMULATION: {
    label: 'Thi Đua & Điểm Rèn Luyện',
    color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
  },
  ACTIVITIES: {
    label: 'Hoạt Động Phong Trào',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
  },
  SYSTEM_ROLES: {
    label: 'Phân Quyền Tài Khoản',
    color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
  },
  GENERAL: {
    label: 'Giao Diện & Danh Mục Chung',
    color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
  }
};

type CatalogTabType =
  | 'annual_awards'
  | 'research_awards'
  | 'position_roles'
  | 'party_mentor'
  | 'roles'
  | 'orgs'
  | 'scales'
  | 'drl'
  | 'sv5t'
  | 'programs_doan'
  | 'programs_hoi'
  | 'menu'
  | 'dictionary'
  | 'personnel_quotas';

export const ScoringCatalogsManagement: React.FC = () => {
  const {
    user,
    organizations,
    setOrganizations,
    drlCriteria,
    updateDrlCriteria,
    resetDrlCriteria,
    sv5tStandards,
    updateSv5tStandards,
    resetSv5tStandards,
    rolePointsMatrix,
    updateRolePointsMatrix,
    doanPrograms,
    updateDoanPrograms,
    resetDoanPrograms,
    hoiPrograms,
    updateHoiPrograms,
    resetHoiPrograms,
    targetScaleConfig,
    updateTargetScaleConfig,
    resetTargetScaleConfig,
    customNavItems,
    updateCustomNavItems,
    resetCustomNavItems,
    systemTerms,
    updateSystemTerms,
    resetSystemTerms,
    annualAwardsCatalog,
    updateAnnualAwardsCatalog,
    researchAwardsCatalog,
    updateResearchAwardsCatalog,
    positionRolesCatalog,
    updatePositionRolesCatalog,
    partyMentorCatalog,
    updatePartyMentorCatalog,
    resetProofCatalogs,
    programPersonnelQuotas,
    updateProgramPersonnelQuotas,
    resetProgramPersonnelQuotas,
    showToast
  } = useApp();

  const isLevel4 = user?.currentRole?.roleLevel === 4;

  // State: Ràng buộc số lượng Ban tổ chức & Cộng tác viên
  const [editingQuotas, setEditingQuotas] = useState<ProgramPersonnelQuota[]>(() => programPersonnelQuotas);
  const [quotaSimulatorLevel, setQuotaSimulatorLevel] = useState<number>(1);
  const [quotaSimulatorBtc, setQuotaSimulatorBtc] = useState<number>(6);
  const [quotaSimulatorCtv, setQuotaSimulatorCtv] = useState<number>(12);

  React.useEffect(() => {
    setEditingQuotas(programPersonnelQuotas);
  }, [programPersonnelQuotas]);

  // Active Sub-Tab: Start with Level-4 annual awards
  const [activeCatalogTab, setActiveCatalogTab] = useState<CatalogTabType>('annual_awards');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // ----------------------------------------------------
  // Tab: Organizations State
  // ----------------------------------------------------
  const [editingOrgCode, setEditingOrgCode] = useState<string | null>(null);
  const [editingOrgData, setEditingOrgData] = useState<Partial<Organization>>({});
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  const [newOrgData, setNewOrgData] = useState<Partial<Organization>>({
    code: '',
    name: '',
    type: 'KHOA',
    hostLevel: 'B',
    hostLevelName: 'Đoàn Khoa / Liên chi hội',
    hostLevelScorePoint: 3,
    email1: ''
  });

  // ----------------------------------------------------
  // Tab: Role Points Matrix State
  // ----------------------------------------------------
  const [editingRoleName, setEditingRoleName] = useState<string | null>(null);
  const [editingRolePoints, setEditingRolePoints] = useState<{ c1: number; c2: number; c3: number; c4: number }>({
    c1: 0,
    c2: 0,
    c3: 0,
    c4: 0
  });

  // ----------------------------------------------------
  // Tab: DRL Criteria State
  // ----------------------------------------------------
  const [editingDrlId, setEditingDrlId] = useState<string | null>(null);
  const [editingDrlTitle, setEditingDrlTitle] = useState('');
  const [showAddDrlModal, setShowAddDrlModal] = useState(false);
  const [newDrlCriteria, setNewDrlCriteria] = useState({ id: '', title: '' });

  // ----------------------------------------------------
  // Tab: SV5T Criteria State
  // ----------------------------------------------------
  const [selectedStandardId, setSelectedStandardId] = useState<string>('STD_DAO_DUC');
  const [editingSv5tId, setEditingSv5tId] = useState<string | null>(null);
  const [editingSv5tCode, setEditingSv5tCode] = useState('');
  const [editingSv5tTitle, setEditingSv5tTitle] = useState('');
  const [editingSv5tRequired, setEditingSv5tRequired] = useState(true);
  const [showAddSv5tModal, setShowAddSv5tModal] = useState(false);
  const [newSv5tCriteria, setNewSv5tCriteria] = useState({ id: '', code: '', title: '', required: true });

  // ----------------------------------------------------
  // Tab: Programs (C.13 & C.14) State
  // ----------------------------------------------------
  const [editingProgId, setEditingProgId] = useState<string | null>(null);
  const [editingProgTitle, setEditingProgTitle] = useState('');
  const [showAddProgModal, setShowAddProgModal] = useState(false);
  const [newProgData, setNewProgData] = useState({ id: '', title: '' });

  // ----------------------------------------------------
  // Tab: Scales State
  // ----------------------------------------------------
  const [scalesList, setScalesList] = useState(() => JSON.parse(JSON.stringify(targetScaleConfig || [])));

  // ----------------------------------------------------
  // Tab: Menu State
  // ----------------------------------------------------
  const [menuItems, setMenuItems] = useState<CustomNavItem[]>(() =>
    JSON.parse(JSON.stringify(customNavItems || []))
  );
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [newMenuData, setNewMenuData] = useState<Partial<CustomNavItem>>({
    id: '',
    label: '',
    iconName: 'Sparkles',
    visible: true,
    minLevel: 0,
    isCustomLink: false,
    externalUrl: ''
  });

  const handleAddMenu = () => {
    if (!newMenuData.id || !newMenuData.label) {
      showToast('Vui lòng nhập đầy đủ Mã ID và Tên Menu!', 'error');
      return;
    }
    if (menuItems.some(m => m.id === newMenuData.id)) {
      showToast('Mã ID menu đã tồn tại!', 'error');
      return;
    }
    const newItem: CustomNavItem = {
      id: newMenuData.id.trim(),
      label: newMenuData.label.trim(),
      description: newMenuData.description || '',
      iconName: newMenuData.iconName || 'Sparkles',
      visible: true,
      minLevel: Number(newMenuData.minLevel || 0),
      isCustomLink: Boolean(newMenuData.isCustomLink),
      externalUrl: newMenuData.externalUrl || '',
      order: menuItems.length + 1
    };
    const updated = [...menuItems, newItem];
    setMenuItems(updated);
    updateCustomNavItems(updated);
    setShowAddMenuModal(false);
    setNewMenuData({
      id: '',
      label: '',
      iconName: 'Sparkles',
      visible: true,
      minLevel: 0,
      isCustomLink: false,
      externalUrl: ''
    });
    showToast('Đã thêm menu mới thành công!', 'success');
  };

  // ----------------------------------------------------
  // Tab: Dictionary State
  // ----------------------------------------------------
  const [termItems, setTermItems] = useState<SystemTermItem[]>(() =>
    JSON.parse(JSON.stringify(systemTerms || []))
  );
  const [dictSearch, setDictSearch] = useState('');
  const [dictCategory, setDictCategory] = useState<string>('ALL');

  if (!isLevel4) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-extrabold text-slate-800 dark:text-white">Quyền Truy Cập Bị Từ Chối</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Tính năng Quản Lý Quy Điểm & Danh Mục Hệ Thống chỉ khả dụng cho tài khoản Cấp Trường (Cấp 4).
        </p>
      </div>
    );
  }

  // ----------------------------------------------------
  // Actions: Organizations
  // ----------------------------------------------------
  const handleEditOrg = (org: Organization) => {
    setEditingOrgCode(org.code);
    setEditingOrgData(org);
  };

  const handleSaveOrg = () => {
    if (!editingOrgCode) return;
    const nextOrgs = organizations.map(o =>
      o.code === editingOrgCode ? ({ ...o, ...editingOrgData } as Organization) : o
    );
    setOrganizations(nextOrgs);
    safeLocalStorageSetItem('nluyouth_orgs', JSON.stringify(nextOrgs));
    setEditingOrgCode(null);
    showToast(`Đã lưu thay đổi cho đơn vị ${editingOrgCode}!`, 'success');
  };

  const handleDeleteOrg = (code: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa đơn vị '${code}' khỏi danh mục lookup hệ thống?`)) return;
    const nextOrgs = organizations.filter(o => o.code !== code);
    setOrganizations(nextOrgs);
    safeLocalStorageSetItem('nluyouth_orgs', JSON.stringify(nextOrgs));
    showToast(`Đã xóa đơn vị ${code} thành công!`, 'success');
  };

  const handleAddOrg = () => {
    if (!newOrgData.code || !newOrgData.name) {
      alert('Vui lòng điền đầy đủ Mã đơn vị và Tên đơn vị!');
      return;
    }
    const upperCode = newOrgData.code.trim().toUpperCase();
    if (organizations.some(o => o.code.toUpperCase() === upperCode)) {
      alert('Mã đơn vị này đã tồn tại trong danh mục!');
      return;
    }
    const nextOrgs = [
      ...organizations,
      {
        id: Date.now(),
        ...newOrgData,
        code: upperCode,
        hostLevelScorePoint: Number(newOrgData.hostLevelScorePoint || 3)
      } as Organization
    ];

    setOrganizations(nextOrgs);
    safeLocalStorageSetItem('nluyouth_orgs', JSON.stringify(nextOrgs));
    setShowAddOrgModal(false);
    setNewOrgData({
      code: '',
      name: '',
      type: 'KHOA',
      hostLevel: 'B',
      hostLevelName: 'Đoàn Khoa / Liên chi hội',
      hostLevelScorePoint: 3,
      email1: ''
    });
    showToast(`Đã thêm mới đơn vị ${upperCode}!`, 'success');
  };

  // ----------------------------------------------------
  // Actions: Role Points
  // ----------------------------------------------------
  const handleEditRole = (role: ParticipantRoleType) => {
    setEditingRoleName(role);
    setEditingRolePoints({ ...(rolePointsMatrix[role] || { c1: 0, c2: 0, c3: 0, c4: 0 }) });
  };

  const handleSaveRole = () => {
    if (!editingRoleName) return;
    const nextMatrix = {
      ...rolePointsMatrix,
      [editingRoleName]: editingRolePoints
    };
    updateRolePointsMatrix(nextMatrix);
    setEditingRoleName(null);
    showToast(`Đã lưu điểm cho vai trò ${editingRoleName}!`, 'success');
  };

  // ----------------------------------------------------
  // Actions: DRL Criteria
  // ----------------------------------------------------
  const handleEditDrl = (id: string, title: string) => {
    setEditingDrlId(id);
    setEditingDrlTitle(title);
  };

  const handleSaveDrl = () => {
    if (!editingDrlId) return;
    const nextDrl = drlCriteria.map(d => (d.id === editingDrlId ? { id: d.id, title: editingDrlTitle } : d));
    updateDrlCriteria(nextDrl);
    setEditingDrlId(null);
    showToast(`Đã cập nhật tiêu chí ${editingDrlId}!`, 'success');
  };

  const handleDeleteDrl = (id: string) => {
    if (!window.confirm(`Xóa tiêu chí ĐRL '${id}'?`)) return;
    const nextDrl = drlCriteria.filter(d => d.id !== id);
    updateDrlCriteria(nextDrl);
    showToast(`Đã xóa tiêu chí ${id}!`, 'success');
  };

  const handleAddDrl = () => {
    if (!newDrlCriteria.id || !newDrlCriteria.title) return;
    const upperId = newDrlCriteria.id.trim();
    if (drlCriteria.some(d => d.id === upperId)) {
      alert('Mã tiêu chí này đã tồn tại!');
      return;
    }
    updateDrlCriteria([...drlCriteria, { id: upperId, title: newDrlCriteria.title.trim() }]);
    setShowAddDrlModal(false);
    setNewDrlCriteria({ id: '', title: '' });
    showToast(`Đã thêm tiêu chí ${upperId}!`, 'success');
  };

  // ----------------------------------------------------
  // Actions: SV5T Standards
  // ----------------------------------------------------
  const currentStandard = sv5tStandards.find(s => s.id === selectedStandardId) || sv5tStandards[0];

  const handleEditSv5t = (c: { id: string; code: string; title: string; required: boolean }) => {
    setEditingSv5tId(c.id);
    setEditingSv5tCode(c.code);
    setEditingSv5tTitle(c.title);
    setEditingSv5tRequired(c.required);
  };

  const handleSaveSv5t = () => {
    if (!editingSv5tId) return;
    const nextStandards = sv5tStandards.map(std => {
      if (std.id === selectedStandardId) {
        return {
          ...std,
          criteria: std.criteria.map(c =>
            c.id === editingSv5tId
              ? {
                  id: c.id,
                  code: editingSv5tCode,
                  title: editingSv5tTitle,
                  required: editingSv5tRequired
                }
              : c
          )
        };
      }
      return std;
    });
    updateSv5tStandards(nextStandards);
    setEditingSv5tId(null);
    showToast(`Đã cập nhật tiêu chí SV5T thành công!`, 'success');
  };

  const handleDeleteSv5t = (cId: string) => {
    if (!window.confirm(`Xóa tiêu chí SV5T này?`)) return;
    const nextStandards = sv5tStandards.map(std => {
      if (std.id === selectedStandardId) {
        return {
          ...std,
          criteria: std.criteria.filter(c => c.id !== cId)
        };
      }
      return std;
    });
    updateSv5tStandards(nextStandards);
    showToast(`Đã xóa tiêu chí SV5T!`, 'success');
  };

  const handleAddSv5t = () => {
    if (!newSv5tCriteria.id || !newSv5tCriteria.code || !newSv5tCriteria.title) return;
    const nextStandards = sv5tStandards.map(std => {
      if (std.id === selectedStandardId) {
        if (std.criteria.some(c => c.id === newSv5tCriteria.id)) {
          alert('ID tiêu chí này đã tồn tại trong nhóm này!');
          return std;
        }
        return {
          ...std,
          criteria: [...std.criteria, { ...newSv5tCriteria }]
        };
      }
      return std;
    });
    updateSv5tStandards(nextStandards);
    setShowAddSv5tModal(false);
    setNewSv5tCriteria({ id: '', code: '', title: '', required: true });
    showToast(`Đã thêm mới tiêu chí SV5T!`, 'success');
  };

  // ----------------------------------------------------
  // Actions: Programs (C.13 / C.14)
  // ----------------------------------------------------
  const isDoanTab = activeCatalogTab === 'programs_doan';
  const progList = isDoanTab ? doanPrograms : hoiPrograms;

  const handleEditProg = (id: string, title: string) => {
    setEditingProgId(id);
    setEditingProgTitle(title);
  };

  const handleSaveProg = () => {
    if (!editingProgId) return;
    const nextProgs = progList.map(p => (p.id === editingProgId ? { id: p.id, title: editingProgTitle } : p));
    if (isDoanTab) {
      updateDoanPrograms(nextProgs);
    } else {
      updateHoiPrograms(nextProgs);
    }
    setEditingProgId(null);
    showToast(`Đã cập nhật mảng công tác ${editingProgId}!`, 'success');
  };

  const handleDeleteProg = (id: string) => {
    if (!window.confirm(`Xóa mảng công tác '${id}' này?`)) return;
    const nextProgs = progList.filter(p => p.id !== id);
    if (isDoanTab) {
      updateDoanPrograms(nextProgs);
    } else {
      updateHoiPrograms(nextProgs);
    }
    showToast(`Đã xóa mảng công tác ${id}!`, 'success');
  };

  const handleAddProg = () => {
    if (!newProgData.id || !newProgData.title) return;
    const upperId = newProgData.id.trim();
    if (progList.some(p => p.id === upperId)) {
      alert('Mã mảng công tác này đã tồn tại!');
      return;
    }
    const nextProgs = [...progList, { id: upperId, title: newProgData.title.trim() }];
    if (isDoanTab) {
      updateDoanPrograms(nextProgs);
    } else {
      updateHoiPrograms(nextProgs);
    }
    setShowAddProgModal(false);
    setNewProgData({ id: '', title: '' });
    showToast(`Đã thêm mảng công tác ${upperId}!`, 'success');
  };

  // ----------------------------------------------------
  // Actions: Scales (TP1)
  // ----------------------------------------------------
  const handleSaveScales = () => {
    updateTargetScaleConfig(scalesList);
    showToast('Đã lưu cấu hình quy mô đối tượng tham gia!', 'success');
  };

  // ----------------------------------------------------
  // Actions: Menu
  // ----------------------------------------------------
  const handleSaveMenu = () => {
    updateCustomNavItems(menuItems);
    showToast('Đã lưu cấu hình Menu điều hướng!', 'success');
  };

  // ----------------------------------------------------
  // Actions: Dictionary
  // ----------------------------------------------------
  const filteredTerms = useMemo(() => {
    return termItems.filter(item => {
      const matchCat = dictCategory === 'ALL' || item.category === dictCategory;
      const q = dictSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.originalText.toLowerCase().includes(q) ||
        item.customText.toLowerCase().includes(q) ||
        item.key.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [termItems, dictCategory, dictSearch]);

  const handleSaveDictionary = () => {
    updateSystemTerms(termItems);
    showToast('Đã lưu từ ngữ hệ thống!', 'success');
  };

  // Filtered Orgs
  const filteredOrgs = useMemo(() => {
    if (!searchQuery) return organizations;
    const q = searchQuery.toLowerCase();
    return organizations.filter(
      o =>
        o.code.toLowerCase().includes(q) ||
        o.name.toLowerCase().includes(q) ||
        (o.facultyCode && o.facultyCode.toLowerCase().includes(q))
    );
  }, [organizations, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-700/20">
            <Settings className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Phân Hệ Quản Trị Cấp 4 Toàn Diện
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Quản Lý Quy Điểm & Danh Mục Hệ Thống
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Trung tâm điều chỉnh hợp nhất: Khung điểm Khen thưởng hằng năm, NCKH, Chức vụ, Đảng viên hướng dẫn,
              Điểm vai trò, 53 Đơn vị Đoàn - Hội, Tiêu chí ĐRL, SV5T, Menu & Từ ngữ hệ thống.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-slate-800/80 border border-emerald-200 dark:border-slate-700 p-3 rounded-2xl text-xs font-bold text-emerald-800 dark:text-emerald-300 shrink-0 relative z-10 shadow-2xs">
          <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Thẩm quyền: Ban Thường Vụ Đoàn Trường</span>
        </div>
      </div>

      {/* Unified Tab Navigation Bar */}
      <div className="bg-slate-100/80 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none shadow-2xs">
        {[
          { id: 'annual_awards', label: '1. Khen Thưởng Hằng Năm', icon: Award, badge: 'Cấp 4' },
          { id: 'research_awards', label: '2. Khen Thưởng NCKH', icon: BookOpen, badge: 'Cấp 4' },
          { id: 'position_roles', label: '3. Chức Vụ Đoàn - Hội', icon: Briefcase, badge: 'Cấp 4' },
          { id: 'party_mentor', label: '4. Đảng Viên HD & ĐV Ưu Tú', icon: Users, badge: 'Cấp 4' },
          { id: 'roles', label: '5. Điểm Vai Trò (1-6đ)', icon: Award, badge: 'Ma trận' },
          { id: 'orgs', label: '6. 53 Đơn Vị & Cấp Đăng Cai', icon: Building, badge: '53 Đơn vị' },
          { id: 'scales', label: '7. Quy Mô Tham Gia (TP1)', icon: Sliders, badge: '1-6 điểm' },
          { id: 'drl', label: '8. Tiêu Chí ĐRL (C.11)', icon: BookOpen, badge: 'C.11' },
          { id: 'sv5t', label: '9. Tiêu Chuẩn SV5T (C.12)', icon: CheckSquare, badge: 'C.12' },
          { id: 'programs_doan', label: '10. Mảng CT Đoàn (C.14)', icon: FileText, badge: 'C.14' },
          { id: 'programs_hoi', label: '11. Mảng CT Hội (C.13)', icon: FileText, badge: 'C.13' },
          { id: 'menu', label: '12. Menu Điều Hướng', icon: Layers, badge: 'Menu' },
          { id: 'dictionary', label: '13. Từ Ngữ Hệ Thống', icon: BookOpen, badge: 'Từ điển' },
          { id: 'personnel_quotas', label: '14. Ràng Buộc BTC & CTV', icon: Users, badge: 'Cấp 1-4' }
        ].map(tab => {
          const IconComponent = tab.icon;
          const isActive = activeCatalogTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveCatalogTab(tab.id as CatalogTabType);
                setSearchQuery('');
              }}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-700/20 font-extrabold scale-[1.02]'
                  : 'bg-white/80 dark:bg-slate-800/70 hover:bg-white text-slate-700 dark:text-slate-300 hover:text-slate-900 border border-slate-200/60 dark:border-slate-700/60'
              }`}
            >
              <IconComponent className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
              <span
                className={`text-[9.5px] px-1.5 py-0.2 rounded-md font-mono ${
                  isActive
                    ? 'bg-emerald-950/60 text-emerald-200'
                    : 'bg-slate-200/80 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ---------------------------------------------------- */}
      {/* 1. Khen Thưởng Hằng Năm (annual_awards) */}
      {/* ---------------------------------------------------- */}
      {activeCatalogTab === 'annual_awards' && (
        <ProofCatalogSection
          catalogName="Danh Mục Khen Thưởng Hằng Năm (Cấp Trường - Cấp 4)"
          category="KHEN_THUONG"
          iconType="award"
          items={annualAwardsCatalog}
          onUpdate={updateAnnualAwardsCatalog}
          onReset={resetProofCatalogs}
          showToast={showToast}
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. Khen Thưởng NCKH (research_awards) */}
      {/* ---------------------------------------------------- */}
      {activeCatalogTab === 'research_awards' && (
        <ProofCatalogSection
          catalogName="Danh Mục Khen Thưởng Nghiên Cứu Khoa Học & Sáng Tạo (Cấp 4)"
          category="NCKH"
          iconType="research"
          items={researchAwardsCatalog}
          onUpdate={updateResearchAwardsCatalog}
          onReset={resetProofCatalogs}
          showToast={showToast}
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. Chức Vụ Đoàn - Hội (position_roles) */}
      {/* ---------------------------------------------------- */}
      {activeCatalogTab === 'position_roles' && (
        <ProofCatalogSection
          catalogName="Danh Mục Chức Vụ Cán Bộ Đoàn - Hội & Lớp (Cấp 4)"
          category="CHUC_VU"
          iconType="position"
          items={positionRolesCatalog}
          onUpdate={updatePositionRolesCatalog}
          onReset={resetProofCatalogs}
          showToast={showToast}
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. Đảng Viên HD & ĐV Ưu Tú (party_mentor) */}
      {/* ---------------------------------------------------- */}
      {activeCatalogTab === 'party_mentor' && (
        <ProofCatalogSection
          catalogName="Danh Mục Đảng Viên Hướng Dẫn & Đoàn Viên Ưu Tú (Cấp 4)"
          category="DANG_VIEN_HUONG_DAN"
          iconType="party"
          items={partyMentorCatalog}
          onUpdate={updatePartyMentorCatalog}
          onReset={resetProofCatalogs}
          showToast={showToast}
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* 5. Role Points Matrix (roles) */}
      {/* ---------------------------------------------------- */}
      {activeCatalogTab === 'roles' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b">
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">
                Ma Trận Quy Điểm Vai Trò (Thành Phần 2: 1 - 6 điểm)
              </h3>
              <p className="text-[11px] text-slate-500">
                Điểm quy đổi chuẩn cho Trưởng ban, Phó ban, Ban tổ chức, Thành viên, CTV, Khán giả theo từng Cấp đăng cai (C1 - C4).
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <th className="p-3 font-bold">Vai Trò Tham Gia</th>
                  <th className="p-3 font-bold text-center">Cấp 1 (Trung ương)</th>
                  <th className="p-3 font-bold text-center">Cấp 2 (Thành phố)</th>
                  <th className="p-3 font-bold text-center">Cấp 3 (Trường)</th>
                  <th className="p-3 font-bold text-center">Cấp 4 (Khoa/CLB)</th>
                  <th className="p-3 font-bold text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(Object.keys(rolePointsMatrix) as ParticipantRoleType[]).map(role => {
                  const pts = rolePointsMatrix[role] || { c1: 0, c2: 0, c3: 0, c4: 0 };
                  const isEditing = editingRoleName === role;

                  return (
                    <tr key={role} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-600" /> {role}
                      </td>

                      {isEditing ? (
                        <>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              className="w-14 p-1 text-center font-bold border rounded-md"
                              value={editingRolePoints.c1}
                              onChange={e =>
                                setEditingRolePoints({ ...editingRolePoints, c1: Number(e.target.value) })
                              }
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              className="w-14 p-1 text-center font-bold border rounded-md"
                              value={editingRolePoints.c2}
                              onChange={e =>
                                setEditingRolePoints({ ...editingRolePoints, c2: Number(e.target.value) })
                              }
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              className="w-14 p-1 text-center font-bold border rounded-md"
                              value={editingRolePoints.c3}
                              onChange={e =>
                                setEditingRolePoints({ ...editingRolePoints, c3: Number(e.target.value) })
                              }
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              className="w-14 p-1 text-center font-bold border rounded-md"
                              value={editingRolePoints.c4}
                              onChange={e =>
                                setEditingRolePoints({ ...editingRolePoints, c4: Number(e.target.value) })
                              }
                            />
                          </td>
                          <td className="p-2 text-right space-x-1">
                            <button
                              onClick={handleSaveRole}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                            >
                              Lưu
                            </button>
                            <button
                              onClick={() => setEditingRoleName(null)}
                              className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs"
                            >
                              Hủy
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                            {pts.c1} đ
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                            {pts.c2} đ
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                            {pts.c3} đ
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                            {pts.c4} đ
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleEditRole(role)}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              Sửa điểm
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 6. Organizations (orgs) */}
      {/* ---------------------------------------------------- */}
      {activeCatalogTab === 'orgs' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b">
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">
                Danh Sách 53 Đơn Vị & Điểm Cấp Đăng Cai (D.2 Lookup)
              </h3>
              <p className="text-[11px] text-slate-500">
                Quyết định điểm số Cấp đăng cai tổ chức (Thành phần 3: Tự động tính từ Trọng số đơn vị 1 - 6 điểm).
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm mã, tên đơn vị..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <button
                onClick={() => setShowAddOrgModal(true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm đơn vị
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <th className="p-3 font-bold">Mã Đơn Vị</th>
                  <th className="p-3 font-bold">Tên Đơn Vị Đoàn - Hội</th>
                  <th className="p-3 font-bold">Phân Loại</th>
                  <th className="p-3 font-bold">Cấp Đăng Cai (C1-C4)</th>
                  <th className="p-3 font-bold text-center">Điểm Host (1-6đ)</th>
                  <th className="p-3 font-bold text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrgs.map(org => {
                  const isEditing = editingOrgCode === org.code;

                  return (
                    <tr key={org.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {org.code}
                      </td>

                      {isEditing ? (
                        <>
                          <td className="p-2">
                            <input
                              type="text"
                              className="w-full p-1 border rounded-md text-xs font-medium"
                              value={editingOrgData.name || ''}
                              onChange={e => setEditingOrgData({ ...editingOrgData, name: e.target.value })}
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={editingOrgData.type || 'KHOA'}
                              onChange={e => setEditingOrgData({ ...editingOrgData, type: e.target.value as any })}
                              className="p-1 border rounded-md text-xs"
                            >
                              <option value="DOAN_TRUONG">Đoàn Trường</option>
                              <option value="HOI_SINH_VIEN">Hội Sinh Viên</option>
                              <option value="KHOA">Đoàn Khoa / LCH</option>
                              <option value="CLB_TRUONG">CLB Cấp Trường</option>
                              <option value="CLB_KHOA">CLB Cấp Khoa</option>
                              <option value="CHI_DOAN">Chi Đoàn</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              className="w-full p-1 border rounded-md text-xs"
                              value={editingOrgData.hostLevelName || ''}
                              onChange={e =>
                                setEditingOrgData({ ...editingOrgData, hostLevelName: e.target.value })
                              }
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="1"
                              max="6"
                              className="w-14 p-1 text-center font-bold border rounded-md"
                              value={editingOrgData.hostLevelScorePoint || 3}
                              onChange={e =>
                                setEditingOrgData({
                                  ...editingOrgData,
                                  hostLevelScorePoint: Number(e.target.value)
                                })
                              }
                            />
                          </td>
                          <td className="p-2 text-right space-x-1">
                            <button
                              onClick={handleSaveOrg}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                            >
                              Lưu
                            </button>
                            <button
                              onClick={() => setEditingOrgCode(null)}
                              className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs"
                            >
                              Hủy
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{org.name}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {org.type}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400 text-xs">
                            {org.hostLevelName || 'Cấp đơn vị'}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {org.hostLevelScorePoint || 3} đ
                          </td>
                          <td className="p-3 text-right space-x-1">
                            <button
                              onClick={() => handleEditOrg(org)}
                              className="p-1.5 text-slate-600 hover:text-emerald-600 rounded-lg"
                              title="Sửa đơn vị"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteOrg(org.code)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                              title="Xóa đơn vị"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 7. Scales (TP1) */}
      {/* ---------------------------------------------------- */}
      {activeCatalogTab === 'scales' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">
                Thành Phần 1: Quy Mô Đối Tượng Tham Gia (1 - 6 điểm)
              </h3>
              <p className="text-[11px] text-slate-500">
                Điều chỉnh tên gọi và thang điểm quy đổi cho từng cấp quy mô tham gia hoạt động.
              </p>
            </div>
            <button
              onClick={handleSaveScales}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Lưu Thay Đổi
            </button>
          </div>

          <div className="space-y-2.5">
            {scalesList.map((scale: any, index: number) => (
              <div
                key={scale.id}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-3"
              >
                <span className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono font-black text-sm flex items-center justify-center shrink-0">
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
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-xs"
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
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-black text-center text-xs text-emerald-700"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 8. DRL Criteria (drl) */}
      {/* ---------------------------------------------------- */}
      {activeCatalogTab === 'drl' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">
                Danh Mục Tiêu Chí Điểm Rèn Luyện (C.11)
              </h3>
              <p className="text-[11px] text-slate-500">
                Cấu hình các đầu điểm tiêu chí rèn luyện theo quy chế của Nhà trường và ĐHQG.
              </p>
            </div>
            <button
              onClick={() => setShowAddDrlModal(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm tiêu chí
            </button>
          </div>

          <div className="space-y-2">
            {drlCriteria.map(item => {
              const isEditing = editingDrlId === item.id;
              return (
                <div
                  key={item.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 w-24 shrink-0">
                    {item.id}
                  </span>

                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingDrlTitle}
                        onChange={e => setEditingDrlTitle(e.target.value)}
                        className="flex-1 p-1.5 border rounded-lg bg-white dark:bg-slate-900 text-xs font-medium"
                      />
                      <button
                        onClick={handleSaveDrl}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                      >
                        Lưu
                      </button>
                      <button
                        onClick={() => setEditingDrlId(null)}
                        className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 font-semibold text-slate-800 dark:text-slate-200">
                        {item.title}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEditDrl(item.id, item.title)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDrl(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 9. SV5T Standards (sv5t) */}
      {/* ---------------------------------------------------- */}
      {activeCatalogTab === 'sv5t' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b">
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">
                Tiêu Chuẩn Xét Chọn Sinh Viên 5 Tốt (C.12)
              </h3>
              <p className="text-[11px] text-slate-500">
                5 Nhóm chuẩn: Đạo đức tốt, Học tập tốt, Thể lực tốt, Tình nguyện tốt, Hội nhập tốt.
              </p>
            </div>
            <button
              onClick={() => setShowAddSv5tModal(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm tiêu chí
            </button>
          </div>

          {/* Nhóm chuẩn Switcher */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b">
            {sv5tStandards.map(std => (
              <button
                key={std.id}
                type="button"
                onClick={() => setSelectedStandardId(std.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedStandardId === std.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {std.name} ({std.criteria.length})
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {currentStandard?.criteria.map((c, idx) => {
              const isEditing = editingSv5tId === c.id;
              return (
                <div
                  key={`${c.id}_${idx}`}
                  className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2 w-32 shrink-0">
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{c.code}</span>
                    {c.required && (
                      <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded-full">
                        Bắt buộc
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingSv5tTitle}
                        onChange={e => setEditingSv5tTitle(e.target.value)}
                        className="flex-1 p-1.5 border rounded-lg bg-white dark:bg-slate-900 text-xs font-medium"
                      />
                      <label className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                        <input
                          type="checkbox"
                          checked={editingSv5tRequired}
                          onChange={e => setEditingSv5tRequired(e.target.checked)}
                        />
                        Bắt buộc
                      </label>
                      <button
                        onClick={handleSaveSv5t}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                      >
                        Lưu
                      </button>
                      <button
                        onClick={() => setEditingSv5tId(null)}
                        className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 font-semibold text-slate-800 dark:text-slate-200">{c.title}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEditSv5t(c)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSv5t(c.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 10 & 11. Programs Đoàn & Hội (programs_doan / programs_hoi) */}
      {/* ---------------------------------------------------- */}
      {(activeCatalogTab === 'programs_doan' || activeCatalogTab === 'programs_hoi') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">
                {isDoanTab
                  ? 'Mảng Công Tác Trọng Tâm Đoàn Thanh Niên (C.14)'
                  : 'Mảng Công Tác Trọng Tâm Hội Sinh Viên (C.13)'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Phân loại hoạt động theo chỉ đạo của Đoàn TNCS HCM và Hội Sinh viên Việt Nam trường ĐH Nông Lâm.
              </p>
            </div>
            <button
              onClick={() => setShowAddProgModal(true)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm mảng CT
            </button>
          </div>

          <div className="space-y-2">
            {progList.map(item => {
              const isEditing = editingProgId === item.id;
              return (
                <div
                  key={item.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 w-24 shrink-0">
                    {item.id}
                  </span>

                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingProgTitle}
                        onChange={e => setEditingProgTitle(e.target.value)}
                        className="flex-1 p-1.5 border rounded-lg bg-white dark:bg-slate-900 text-xs font-medium"
                      />
                      <button
                        onClick={handleSaveProg}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                      >
                        Lưu
                      </button>
                      <button
                        onClick={() => setEditingProgId(null)}
                        className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 font-semibold text-slate-800 dark:text-slate-200">
                        {item.title}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEditProg(item.id, item.title)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProg(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 12. Menu Điều Hướng (menu) */}
      {/* ---------------------------------------------------- */}
      {activeCatalogTab === 'menu' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">
                Cấu Hình Menu & Phân Hệ Điều Hướng Chính
              </h3>
              <p className="text-[11px] text-slate-500">
                Sắp xếp thứ tự hiển thị, đổi tên nhãn và gán biểu tượng cho các phân hệ trên thanh điều hướng.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddMenuModal(true)}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm Menu Mới
              </button>
              <button
                onClick={handleSaveMenu}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Lưu Cấu Hình Menu
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {menuItems.map((item, idx) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between gap-3 text-xs"
              >
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
                          next.forEach((it, i) => {
                            it.order = i + 1;
                          });
                          setMenuItems(next);
                        }
                      }}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-20 cursor-pointer"
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
                          next.forEach((it, i) => {
                            it.order = i + 1;
                          });
                          setMenuItems(next);
                        }
                      }}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-20 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono font-bold text-[10px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <select
                    value={item.iconName || 'Link'}
                    onChange={e => {
                      const next = [...menuItems];
                      next[idx].iconName = e.target.value;
                      setMenuItems(next);
                    }}
                    className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono max-w-[120px]"
                  >
                    {AVAILABLE_ICON_NAMES.map(ic => (
                      <option key={ic} value={ic}>
                        {ic}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={item.label}
                    onChange={e => {
                      const next = [...menuItems];
                      next[idx].label = e.target.value;
                      setMenuItems(next);
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...menuItems];
                      next[idx].visible = next[idx].visible === false ? true : false;
                      setMenuItems(next);
                    }}
                    className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                      item.visible !== false
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {item.visible !== false ? (
                      <>
                        <Eye className="w-3.5 h-3.5" /> Hiện
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" /> Ẩn
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 13. Từ Ngữ Hệ Thống (dictionary) */}
      {/* ---------------------------------------------------- */}
      {activeCatalogTab === 'dictionary' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b">
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">
                Từ Ngữ & Thuật Ngữ Hệ Thống NLU
              </h3>
              <p className="text-[11px] text-slate-500">
                Tùy chỉnh thuật ngữ, nhãn tiêu đề, thông báo hiển thị trên toàn bộ giao diện hệ thống.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveDictionary}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" /> Lưu Từ Ngữ
              </button>
            </div>
          </div>

          {/* Dictionary Search & Category Filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={dictSearch}
                onChange={e => setDictSearch(e.target.value)}
                placeholder="Tìm theo từ gốc, từ tùy biến, mã key..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium"
              />
            </div>
            <select
              value={dictCategory}
              onChange={e => setDictCategory(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-xs font-medium bg-white dark:bg-slate-800"
            >
              <option value="ALL">Tất cả danh mục</option>
              {Object.keys(CATEGORY_LABELS).map(cat => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat as SystemTermCategory]?.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredTerms.map(term => (
              <div
                key={term.id}
                className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-slate-400">{term.key}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-slate-100 text-slate-700">
                    {CATEGORY_LABELS[term.category]?.label || term.category}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold">Từ ngữ mặc định</label>
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 font-medium">
                      {term.originalText}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-emerald-600 font-bold">Từ ngữ tùy chỉnh</label>
                    <input
                      type="text"
                      value={term.customText}
                      onChange={e => {
                        const next = termItems.map(t => (t.id === term.id ? { ...t, customText: e.target.value } : t));
                        setTermItems(next);
                      }}
                      className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 14. Ràng Buộc Số Lượng BTC & CTV (personnel_quotas) */}
      {/* ---------------------------------------------------- */}
      {activeCatalogTab === 'personnel_quotas' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-white text-base">
                    Danh Mục Ràng Buộc Số Lượng Ban Tổ Chức & Cộng Tác Viên
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Áp dụng cho mỗi chương trình được tạo ra ở Cổng Quản Lý Hoạt Động & Quy Trình Phê Duyệt khi nhập danh sách tham gia
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Khôi phục định mức ràng buộc Ban tổ chức & Cộng tác viên về mặc định (C1: 5/10, C2: 10/20, C3: 15/30, C4: 20/40)?')) {
                    resetProgramPersonnelQuotas();
                    setEditingQuotas(DEFAULT_PROGRAM_PERSONNEL_QUOTAS);
                  }
                }}
                className="px-3 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Khôi Phục Mặc Định</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  updateProgramPersonnelQuotas(editingQuotas);
                }}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-700/20 cursor-pointer transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu Thay Đổi Ràng Buộc</span>
              </button>
            </div>
          </div>

          {/* Official Rule Policy Summary Card */}
          <div className="bg-gradient-to-r from-slate-50 via-indigo-50/40 to-teal-50/40 dark:from-slate-800/60 dark:via-indigo-950/20 dark:to-teal-950/20 border border-slate-200 dark:border-slate-700 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-bold text-xs">
              <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Quy định ràng buộc chính thức áp dụng toàn hệ thống:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400">Chương trình Cấp 1</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 font-bold">Cấp 1</span>
                </div>
                <div className="space-y-1 text-slate-700 dark:text-slate-300 font-medium text-[11.5px]">
                  <div>• Ban tổ chức: <strong>không quá {editingQuotas.find(q => q.level === 1)?.maxBtc ?? 5} người</strong></div>
                  <div>• Cộng tác viên: <strong>không quá {editingQuotas.find(q => q.level === 1)?.maxCtv ?? 10} người</strong></div>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-sky-200 dark:border-sky-800/60 shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-sky-700 dark:text-sky-400">Chương trình Cấp 2</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-100 dark:bg-sky-950 text-sky-800 font-bold">Cấp 2</span>
                </div>
                <div className="space-y-1 text-slate-700 dark:text-slate-300 font-medium text-[11.5px]">
                  <div>• Ban tổ chức: <strong>không quá {editingQuotas.find(q => q.level === 2)?.maxBtc ?? 10} người</strong></div>
                  <div>• Cộng tác viên: <strong>không quá {editingQuotas.find(q => q.level === 2)?.maxCtv ?? 20} người</strong></div>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-amber-800/60 shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-amber-700 dark:text-amber-400">Chương trình Cấp 3</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 font-bold">Cấp 3</span>
                </div>
                <div className="space-y-1 text-slate-700 dark:text-slate-300 font-medium text-[11.5px]">
                  <div>• Ban tổ chức: <strong>không quá {editingQuotas.find(q => q.level === 3)?.maxBtc ?? 15} người</strong></div>
                  <div>• Cộng tác viên: <strong>không quá {editingQuotas.find(q => q.level === 3)?.maxCtv ?? 30} người</strong></div>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-purple-200 dark:border-purple-800/60 shadow-2xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-purple-700 dark:text-purple-400">Chương trình Cấp 4</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-800 font-bold">Cấp 4</span>
                </div>
                <div className="space-y-1 text-slate-700 dark:text-slate-300 font-medium text-[11.5px]">
                  <div>• Ban tổ chức: <strong>không quá {editingQuotas.find(q => q.level === 4)?.maxBtc ?? 20} người</strong></div>
                  <div>• Cộng tác viên: <strong>không quá {editingQuotas.find(q => q.level === 4)?.maxCtv ?? 40} người</strong></div>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
              ⚡ Ghi chú kiểm soát: Khi tải lên file Excel (.xlsx) danh sách tham gia, nếu số lượng BTC hoặc CTV vượt quá giới hạn trên, hệ thống sẽ <strong>hiện thông báo màu đỏ và khóa nút nạp</strong>, yêu cầu đơn vị phải điều chỉnh file theo đúng ràng buộc thì mới được phép nhập.
            </p>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
              <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong>Ràng buộc đặc thù đối với Đoàn trường & Hội Sinh viên trường:</strong> Tất cả chương trình, kế hoạch hoạt động do Đoàn trường hoặc Hội Sinh viên trường chủ trì tổ chức bắt buộc phải là <strong>chương trình Cấp 3 trở lên</strong> (Cấp 3 hoặc Cấp 4, tương ứng mức điểm phân cấp ≥ 12đ). Hệ thống tự động kiểm tra và áp dụng mức sàn tối thiểu Cấp 3 khi tạo mới và khi nạp danh sách tham gia.
              </div>
            </div>
          </div>

          {/* Detailed Config Table / Cards */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>Bảng Cấu Hình Chi Tiết Giới Hạn Từng Cấp Chương Trình</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {editingQuotas.map(quota => {
                const colorMap = {
                  1: 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300',
                  2: 'border-sky-300 dark:border-sky-700 bg-sky-50/30 dark:bg-sky-950/20 text-sky-800 dark:text-sky-300',
                  3: 'border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300',
                  4: 'border-purple-300 dark:border-purple-700 bg-purple-50/30 dark:bg-purple-950/20 text-purple-800 dark:text-purple-300',
                }[quota.level] || 'border-slate-300 bg-slate-50 text-slate-800';

                return (
                  <div
                    key={quota.level}
                    className="p-5 rounded-2xl border bg-white dark:bg-slate-800/80 shadow-xs space-y-4 hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2.5 py-1 rounded-lg font-black text-xs border ${colorMap}`}>
                          CẤP {quota.level}
                        </span>
                        <div>
                          <h5 className="font-extrabold text-sm text-slate-800 dark:text-white">
                            {quota.levelName}
                          </h5>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Phân loại cấp hoạt động
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-400">
                        Level {quota.level}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-amber-600" />
                          <span>Tối Đa Ban Tổ Chức</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={quota.maxBtc}
                            onChange={e => {
                              const val = Math.max(1, parseInt(e.target.value) || 1);
                              setEditingQuotas(prev => prev.map(q => q.level === quota.level ? { ...q, maxBtc: val } : q));
                            }}
                            className="w-full p-2 font-black text-center text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                          />
                          <span className="text-xs text-slate-500 font-bold shrink-0">người</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Mặc định: {quota.level === 1 ? 5 : quota.level === 2 ? 10 : quota.level === 3 ? 15 : 20}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-sky-600" />
                          <span>Tối Đa Cộng Tác Viên</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="200"
                            value={quota.maxCtv}
                            onChange={e => {
                              const val = Math.max(1, parseInt(e.target.value) || 1);
                              setEditingQuotas(prev => prev.map(q => q.level === quota.level ? { ...q, maxCtv: val } : q));
                            }}
                            className="w-full p-2 font-black text-center text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                          />
                          <span className="text-xs text-slate-500 font-bold shrink-0">người</span>
                        </div>
                        <p className="text-[10px] text-slate-400">Mặc định: {quota.level === 1 ? 10 : quota.level === 2 ? 20 : quota.level === 3 ? 30 : 40}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Mô Tả / Phạm Vi Áp Dụng
                      </label>
                      <input
                        type="text"
                        value={quota.description || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setEditingQuotas(prev => prev.map(q => q.level === quota.level ? { ...q, description: val } : q));
                        }}
                        placeholder="Nhập ghi chú hoặc mô tả phân loại..."
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Test Validator Simulator */}
          <div className="p-4.5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-amber-300">
                  Công Cụ Thử Nghiệm Kiểm Tra Ràng Buộc (Live Simulator)
                </h4>
              </div>
              <span className="text-[10px] text-slate-400">Mô phỏng cơ chế kiểm duyệt khi nhập file</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 font-bold mb-1">Cấp chương trình thử nghiệm</label>
                <select
                  value={quotaSimulatorLevel}
                  onChange={e => setQuotaSimulatorLevel(Number(e.target.value))}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold"
                >
                  <option value={1}>Chương trình Cấp 1</option>
                  <option value={2}>Chương trình Cấp 2</option>
                  <option value={3}>Chương trình Cấp 3</option>
                  <option value={4}>Chương trình Cấp 4</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-bold mb-1">Số lượng Ban tổ chức (BTC)</label>
                <input
                  type="number"
                  min="0"
                  value={quotaSimulatorBtc}
                  onChange={e => setQuotaSimulatorBtc(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-bold mb-1">Số lượng Cộng tác viên (CTV)</label>
                <input
                  type="number"
                  min="0"
                  value={quotaSimulatorCtv}
                  onChange={e => setQuotaSimulatorCtv(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold text-center"
                />
              </div>
            </div>

            {/* Test result display */}
            {(() => {
              const testQuota = editingQuotas.find(q => q.level === quotaSimulatorLevel) || {
                level: quotaSimulatorLevel,
                levelName: `Chương trình Cấp ${quotaSimulatorLevel}`,
                maxBtc: quotaSimulatorLevel === 1 ? 5 : quotaSimulatorLevel === 2 ? 10 : quotaSimulatorLevel === 3 ? 15 : 20,
                maxCtv: quotaSimulatorLevel === 1 ? 10 : quotaSimulatorLevel === 2 ? 20 : quotaSimulatorLevel === 3 ? 30 : 40,
              };
              const btcViolated = quotaSimulatorBtc > testQuota.maxBtc;
              const ctvViolated = quotaSimulatorCtv > testQuota.maxCtv;
              const isViolated = btcViolated || ctvViolated;

              return (
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                    isViolated
                      ? 'bg-rose-950/60 border-rose-600 text-rose-200'
                      : 'bg-emerald-950/60 border-emerald-600 text-emerald-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isViolated ? (
                      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                    <div className="text-xs">
                      <span className="font-extrabold uppercase">
                        {isViolated
                          ? '⛔ KẾT QUẢ: BỊ CHẶN - KHÔNG CHO PHÉP NHẬP DỮ LIỆU'
                          : '✅ KẾT QUẢ: HỢP LỆ - ĐƯỢC PHÉP NHẬP DỮ LIỆU'}
                      </span>
                      <p className="text-[11px] opacity-90 mt-0.5">
                        {isViolated ? (
                          <>
                            Vi phạm định mức {testQuota.levelName}:{' '}
                            {btcViolated && `BTC có ${quotaSimulatorBtc}/${testQuota.maxBtc} người (vượt ${quotaSimulatorBtc - testQuota.maxBtc}). `}
                            {ctvViolated && `CTV có ${quotaSimulatorCtv}/${testQuota.maxCtv} người (vượt ${quotaSimulatorCtv - testQuota.maxCtv}). `}
                            Hệ thống sẽ chặn không cho nhập dữ liệu!
                          </>
                        ) : (
                          <>
                            Số lượng nhân sự nằm trong hạn mức cho phép ({quotaSimulatorBtc}/{testQuota.maxBtc} BTC và {quotaSimulatorCtv}/{testQuota.maxCtv} CTV). Nút nạp dữ liệu hoạt động bình thường!
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black shrink-0 ${
                      isViolated ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {isViolated ? 'BỊ CHẶN' : 'HỢP LỆ'}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* Modal: Thêm đơn vị mới */}
      {/* ---------------------------------------------------- */}
      {showAddOrgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" /> Thêm đơn vị mới
              </h3>
              <button onClick={() => setShowAddOrgModal(false)} className="p-1 rounded text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div>
                <label className="block mb-1">Mã đơn vị (viết tắt) *</label>
                <input
                  type="text"
                  placeholder="Vd: KHMT, TY, CNTP..."
                  value={newOrgData.code}
                  onChange={e => setNewOrgData({ ...newOrgData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block mb-1">Tên đơn vị đầy đủ *</label>
                <input
                  type="text"
                  placeholder="Vd: Khoa Khoa học Máy tính..."
                  value={newOrgData.name}
                  onChange={e => setNewOrgData({ ...newOrgData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block mb-1">Phân loại tổ chức</label>
                <select
                  value={newOrgData.type}
                  onChange={e => setNewOrgData({ ...newOrgData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="KHOA">Đoàn Khoa / Liên Chi Hội</option>
                  <option value="CLB_TRUONG">Câu Lạc Bộ Cấp Trường</option>
                  <option value="CLB_KHOA">Câu Lạc Bộ Cấp Khoa</option>
                  <option value="CHI_DOAN">Chi Đoàn Trực Thuộc</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Điểm Cấp đăng cai (1 - 6 điểm)</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={newOrgData.hostLevelScorePoint}
                  onChange={e => setNewOrgData({ ...newOrgData, hostLevelScorePoint: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-emerald-500 font-bold"
                />
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowAddOrgModal(false)}
                className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleAddOrg}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
              >
                Lưu đơn vị
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* Modal: Thêm Tiêu Chí ĐRL */}
      {/* ---------------------------------------------------- */}
      {showAddDrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" /> Thêm Tiêu Chí ĐRL mới
              </h3>
              <button onClick={() => setShowAddDrlModal(false)} className="p-1 rounded text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div>
                <label className="block mb-1">Mã tiêu chí (Vd: TC_9, C1.2...) *</label>
                <input
                  type="text"
                  placeholder="Vd: TC_10"
                  value={newDrlCriteria.id}
                  onChange={e => setNewDrlCriteria({ ...newDrlCriteria, id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block mb-1">Nội dung tiêu chí rèn luyện *</label>
                <textarea
                  placeholder="Vd: Đóng học phí và bảo hiểm y tế đúng hạn..."
                  value={newDrlCriteria.title}
                  onChange={e => setNewDrlCriteria({ ...newDrlCriteria, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-emerald-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowAddDrlModal(false)}
                className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleAddDrl}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
              >
                Tạo tiêu chí
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* Modal: Thêm Tiêu Chí SV5T */}
      {/* ---------------------------------------------------- */}
      {showAddSv5tModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" /> Thêm Tiêu Chí SV5T vào [{currentStandard.name}]
              </h3>
              <button onClick={() => setShowAddSv5tModal(false)} className="p-1 rounded text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div>
                <label className="block mb-1">Mã định danh *</label>
                <input
                  type="text"
                  placeholder="Vd: A5.4, B8.2..."
                  value={newSv5tCriteria.id}
                  onChange={e => setNewSv5tCriteria({ ...newSv5tCriteria, id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block mb-1">Mã hiển thị *</label>
                <input
                  type="text"
                  placeholder="Vd: A5.4, B8.2..."
                  value={newSv5tCriteria.code}
                  onChange={e => setNewSv5tCriteria({ ...newSv5tCriteria, code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block mb-1">Tiêu đề tiêu chí SV5T *</label>
                <textarea
                  placeholder="Vd: Tham gia chiến dịch tình nguyện Mùa Hè Xanh..."
                  value={newSv5tCriteria.title}
                  onChange={e => setNewSv5tCriteria({ ...newSv5tCriteria, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-emerald-500"
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="sv5t-req"
                  checked={newSv5tCriteria.required}
                  onChange={e => setNewSv5tCriteria({ ...newSv5tCriteria, required: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="sv5t-req" className="font-bold cursor-pointer">
                  Tiêu chí bắt buộc (Bắt buộc phải đạt để xét SV5T)
                </label>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowAddSv5tModal(false)}
                className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleAddSv5t}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
              >
                Tạo tiêu chí
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* Modal: Thêm Mảng Công Tác Mới */}
      {/* ---------------------------------------------------- */}
      {showAddProgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" /> Thêm mảng Công tác mới
              </h3>
              <button onClick={() => setShowAddProgModal(false)} className="p-1 rounded text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div>
                <label className="block mb-1">Mã mảng công tác *</label>
                <input
                  type="text"
                  placeholder="Vd: KR8.3, 10, 11..."
                  value={newProgData.id}
                  onChange={e => setNewProgData({ ...newProgData, id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block mb-1">Tên mảng công tác *</label>
                <textarea
                  placeholder="Vd: Tổ chức các chiến dịch tình nguyện..."
                  value={newProgData.title}
                  onChange={e => setNewProgData({ ...newProgData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-emerald-500"
                  rows={2}
                />
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowAddProgModal(false)}
                className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleAddProg}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
              >
                Tạo mảng công tác
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* Modal: Thêm Menu Mới */}
      {/* ---------------------------------------------------- */}
      {showAddMenuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" /> Thêm Phân Hệ / Menu Mới
              </h3>
              <button onClick={() => setShowAddMenuModal(false)} className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div>
                <label className="block mb-1">Mã ID Phân Hệ *</label>
                <input
                  type="text"
                  placeholder="Vd: custom_page_1"
                  value={newMenuData.id || ''}
                  onChange={e => setNewMenuData({ ...newMenuData, id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 font-bold font-mono"
                />
              </div>

              <div>
                <label className="block mb-1">Tên Hiển Thị Menu *</label>
                <input
                  type="text"
                  placeholder="Vd: Góc Tư Vấn Đoàn Viên..."
                  value={newMenuData.label || ''}
                  onChange={e => setNewMenuData({ ...newMenuData, label: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block mb-1">Biểu Tượng (Icon Name)</label>
                <select
                  value={newMenuData.iconName || 'Sparkles'}
                  onChange={e => setNewMenuData({ ...newMenuData, iconName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 font-mono"
                >
                  {AVAILABLE_ICON_NAMES.map(ic => (
                    <option key={ic} value={ic}>
                      {ic}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1">Quyền Xem Tối Thiểu (Min Level)</label>
                <select
                  value={newMenuData.minLevel ?? 0}
                  onChange={e => setNewMenuData({ ...newMenuData, minLevel: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-500"
                >
                  <option value={0}>Cấp 0 - Khách / Công khai</option>
                  <option value={1}>Cấp 1 - Sinh viên</option>
                  <option value={2}>Cấp 2 - Cán bộ Chi đoàn</option>
                  <option value={3}>Cấp 3 - Đoàn khoa / Liên chi hội</option>
                  <option value={4}>Cấp 4 - Ban Thường vụ Đoàn trường (Admin)</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Đường Dẫn Ngoài (External URL - Tùy chọn)</label>
                <input
                  type="text"
                  placeholder="Vd: https://doanthanhnien.vn..."
                  value={newMenuData.externalUrl || ''}
                  onChange={e => setNewMenuData({ ...newMenuData, externalUrl: e.target.value, isCustomLink: !!e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowAddMenuModal(false)}
                className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleAddMenu}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer"
              >
                Tạo Menu Mới
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
