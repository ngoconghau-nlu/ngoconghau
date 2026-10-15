import React from 'react';
import {
  BarChart3,
  Target,
  Calendar,
  Award,
  FileText,
  Building2,
  Key,
  History,
  HardDrive,
  Sparkles,
  Link,
  ExternalLink,
  Shield,
  Settings2,
  Sliders,
  CheckSquare,
  Users,
  QrCode,
  BookOpen,
  CloudUpload,
  UserCheck,
  Search,
  FolderOpen,
  Compass,
  Trophy,
  Activity,
  Layers,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { RoleLevel, CustomNavItem } from '../types';

export interface SubNavigationItem {
  id: string;
  label: string;
  subLabel?: string;
  targetTab: string;
  iconName: string;
  badge?: string;
  badgeColor?: string;
  minLevel?: RoleLevel;
  visible?: boolean;
  keywords?: string[];
  subRouteAction?: string;
}

export interface NavigationItemConfig {
  id: string;
  label: string;
  shortLabel?: string;
  description: string;
  iconName: string;
  minLevel: RoleLevel;
  group: 'OVERVIEW' | 'TARGETS' | 'ACTIVITIES' | 'STUDENT' | 'EMULATION' | 'ORGANIZATION' | 'SYSTEM';
  groupLabel: string;
  badge: string;
  permissionLabel: string;
  order: number;
  visible?: boolean;
  externalUrl?: string;
  subItems?: SubNavigationItem[];
  keywords: string[];
}

export const NAVIGATION_GROUPS = [
  { id: 'OVERVIEW', label: 'Tổng quan', iconName: 'BarChart3' },
  { id: 'ACTIVITIES', label: 'Hoạt động', iconName: 'Calendar' },
  { id: 'STUDENT', label: 'Sinh viên', iconName: 'BookOpen' },
  { id: 'EMULATION', label: 'Thi đua', iconName: 'Trophy' },
  { id: 'TARGETS', label: 'Chỉ tiêu', iconName: 'Target' },
  { id: 'ORGANIZATION', label: 'Tổ chức', iconName: 'Building2' },
  { id: 'SYSTEM', label: 'Quản trị', iconName: 'Shield' }
] as const;

export const ICON_REGISTRY: Record<string, React.ComponentType<{ className?: string }>> = {
  BarChart3,
  Target,
  Calendar,
  Award,
  FileText,
  Building2,
  Key,
  History,
  HardDrive,
  Sparkles,
  Link,
  ExternalLink,
  Shield,
  Settings2,
  Sliders,
  CheckSquare,
  Users,
  QrCode,
  BookOpen,
  CloudUpload,
  UserCheck,
  Search,
  FolderOpen,
  Compass,
  Trophy,
  Activity,
  Layers,
  ShieldAlert,
  HelpCircle
};

export const AVAILABLE_ICON_NAMES = Object.keys(ICON_REGISTRY);

export const CANONICAL_NAVIGATION_CONFIG: NavigationItemConfig[] = [
  // Nhóm 1: Tổng quan & Báo cáo
  {
    id: 'dashboard',
    label: 'Dashboard tổng quan',
    shortLabel: 'Tổng quan',
    description: 'Thống kê thời gian thực: chỉ số hoạt động, điểm rèn luyện và bảng xếp hạng thi đua toàn trường.',
    iconName: 'BarChart3',
    minLevel: 0,
    group: 'OVERVIEW',
    groupLabel: 'Tổng quan',
    badge: 'Tổng quan',
    permissionLabel: 'Công khai (Cấp 0+)',
    order: 1,
    keywords: ['dashboard', 'thong ke', 'tong quan', 'bieu do', 'bao cao nhanh', 'toan truong']
  },

  // Nhóm 2: Kế hoạch & Chỉ tiêu
  {
    id: 'targets',
    label: 'Kế hoạch & chỉ tiêu',
    shortLabel: 'Chỉ tiêu',
    description: 'Hệ thống chỉ tiêu năm học của Đoàn - Hội, phân bổ định ngạch cho 53 đơn vị và giám sát tiến độ.',
    iconName: 'Target',
    minLevel: 1,
    group: 'TARGETS',
    groupLabel: 'Kế hoạch & chỉ tiêu',
    badge: 'Chỉ tiêu',
    permissionLabel: 'Cấp 1+',
    order: 2,
    keywords: ['chi tieu', 'kpi', 'nam hoc', 'tien do', 'dinh ngach', '53 don vi', 'doan hoi'],
    subItems: [
      {
        id: 'targets-kpi',
        label: 'Chỉ tiêu & KPIs năm học',
        subLabel: 'Theo dõi tiến độ hoàn thành các chỉ tiêu trọng tâm',
        targetTab: 'targets',
        iconName: 'Target',
        badge: 'Trọng tâm',
        badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
        minLevel: 1,
        subRouteAction: 'overview',
        keywords: ['kpi', 'chi tieu nam hoc', 'tien do', 'trong tam']
      },
      {
        id: 'targets-units',
        label: 'Phân bổ định ngạch đơn vị',
        subLabel: 'Chỉ tiêu giao cho 53 đơn vị trực thuộc Đoàn - Hội',
        targetTab: 'targets',
        iconName: 'Sliders',
        badge: '53 Đơn vị',
        badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
        minLevel: 2,
        subRouteAction: 'hierarchical',
        keywords: ['phan bo', 'dinh ngach', 'khoa', 'clb', 'don vi']
      }
    ]
  },

  // Nhóm 3: Quản lý Hoạt động
  {
    id: 'activities',
    label: 'Quản lý hoạt động',
    shortLabel: 'Hoạt động',
    description: 'Tạo mới, phê duyệt cấp 1-4, quản lý danh sách người tham gia và điểm danh QR tức thời.',
    iconName: 'Calendar',
    minLevel: 1,
    group: 'ACTIVITIES',
    groupLabel: 'Quản lý hoạt động',
    badge: 'Hoạt động',
    permissionLabel: 'Cấp 1+',
    order: 3,
    keywords: ['hoat dong', 'su kien', 'phe duyet', 'ke hoach', 'diem danh', 'qr check-in', 'minh chung'],
    subItems: [
      {
        id: 'activities-all',
        label: 'Danh sách hoạt động & phê duyệt',
        subLabel: 'Quản lý quy trình duyệt L1-L4, lọc theo năm học & học kỳ',
        targetTab: 'activities',
        iconName: 'Calendar',
        badge: 'Kế hoạch',
        badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
        minLevel: 1,
        keywords: ['danh sach', 'phe duyet', 'duyet hoat dong', 'loc']
      },
      {
        id: 'activities-qr',
        label: 'Điểm danh tự động & quét QR',
        subLabel: 'Chế độ quét mã QR tức thì ghi nhận tham gia',
        targetTab: 'checkin-qr',
        iconName: 'QrCode',
        badge: 'QR Check-in',
        badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
        minLevel: 1,
        visible: false,
        keywords: ['quet ma', 'qr code', 'diem danh', 'check-in', 'quet qr']
      }
    ]
  },

  // Nhóm 4: Sinh viên & Rèn luyện
  {
    id: 'student-portal',
    label: 'Cổng sinh viên & SV5T',
    shortLabel: 'Cổng SV',
    description: 'Cổng thông tin sinh viên: sổ điểm rèn luyện cá nhân, minh chứng tự khai và xét duyệt Sinh viên 5 Tốt.',
    iconName: 'Award',
    minLevel: 1,
    group: 'STUDENT',
    groupLabel: 'Sinh viên & rèn luyện',
    badge: 'Cổng SV',
    permissionLabel: 'Cấp 1+',
    order: 4,
    keywords: ['sinh vien', 'ca nhan', 'tra cuu drl', 'sinh vien 5 tot', 'sv5t', 'minh chung tu nop'],
    subItems: [
      {
        id: 'portal-records',
        label: 'Sổ điểm & tra cứu cá nhân',
        subLabel: 'Xem điểm rèn luyện chi tiết và các hoạt động đã tham gia',
        targetTab: 'student-portal',
        iconName: 'FileText',
        badge: 'Sổ điểm',
        badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
        minLevel: 1,
        subRouteAction: 'records',
        keywords: ['tra cuu', 'diem ca nhan', 'lich su tham gia', 'so diem']
      },
      {
        id: 'portal-sv5t',
        label: 'Tiêu chuẩn sinh viên 5 tốt',
        subLabel: 'Theo dõi 5 tiêu chuẩn chuẩn hóa NLU và gửi hồ sơ xét duyệt',
        targetTab: 'student-portal',
        iconName: 'CheckSquare',
        badge: 'SV5T',
        badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
        minLevel: 1,
        subRouteAction: 'sv5t',
        keywords: ['sinh vien 5 tot', 'sv5t', 'dao duc tot', 'hoc tap tot', 'the luc tot']
      }
    ]
  },

  // Nhóm 5: Thi đua & Xếp loại
  {
    id: 'score-roster',
    label: 'Sổ điểm & thi đua cơ sở',
    shortLabel: 'Thi đua',
    description: 'Sổ điểm rèn luyện số, theo dõi xếp loại và bảng tổng hợp thi đua 16 Đoàn Khoa, Chi đoàn, CLB.',
    iconName: 'FileText',
    minLevel: 1,
    group: 'EMULATION',
    groupLabel: 'Thi đua & xếp loại',
    badge: 'Sổ điểm',
    permissionLabel: 'Cấp 1+',
    order: 5,
    keywords: ['so diem', 'ren luyen', 'thi dua', 'xep hang', 'khoa', 'chi doan', 'clb', 'xuat excel', 'pdf'],
    subItems: [
      {
        id: 'student-roster',
        label: 'Sổ điểm rèn luyện & đánh giá SV',
        subLabel: 'Tra cứu điểm số, phân loại xuất sắc/tốt và xuất báo cáo PDF/Excel',
        targetTab: 'score-roster',
        iconName: 'FileText',
        badge: 'Cá nhân',
        badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
        minLevel: 1,
        keywords: ['so diem', 'sinh vien', 'danh gia', 'export pdf']
      },
      {
        id: 'faculty-emulation',
        label: 'Bảng thi đua Đoàn - Hội khoa',
        subLabel: 'Xếp hạng thi đua và chỉ số phong trào 16 Đoàn Khoa',
        targetTab: 'faculty-emulation',
        iconName: 'Award',
        badge: '16 Khoa',
        badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
        minLevel: 1,
        keywords: ['thi dua khoa', '16 khoa', 'xep hang khoa']
      },
      {
        id: 'branch-emulation',
        label: 'Bảng thi đua cơ sở chi đoàn',
        subLabel: 'Đánh giá 4 mức chuẩn đoàn viên chi đoàn và phong trào lớp',
        targetTab: 'branch-emulation',
        iconName: 'Users',
        badge: 'Chi đoàn',
        badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
        minLevel: 1,
        keywords: ['chi doan', 'doan vien', 'xep loai chi doan']
      },
      {
        id: 'club-emulation',
        label: 'Thi đua CLB / đội / nhóm',
        subLabel: 'Theo dõi 37 Câu lạc bộ, Đội, Nhóm toàn trường',
        targetTab: 'club-emulation',
        iconName: 'Sparkles',
        badge: '37 CLB',
        badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
        minLevel: 1,
        keywords: ['clb', 'doi', 'nhom', 'thi dua clb']
      }
    ]
  },

  // Nhóm 6: Tổ chức & Chứng nhận
  {
    id: 'organizations',
    label: 'Danh mục đơn vị NLU',
    shortLabel: 'Đơn vị',
    description: 'Danh bạ cơ cấu tổ chức Đoàn - Hội: 53 đơn vị trực thuộc, Đoàn cơ sở, Chi đoàn và Ban chuyên môn.',
    iconName: 'Building2',
    minLevel: 3,
    group: 'ORGANIZATION',
    groupLabel: 'Tổ chức & chứng nhận',
    badge: '53 Đơn vị',
    permissionLabel: 'Cấp 3+',
    order: 6,
    keywords: ['don vi', 'danh ba', 'co cau', 'khoa', 'clb truong', 'clb khoa', 'to doi nhom']
  },
  {
    id: 'certificates',
    label: 'Giấy chứng nhận điện tử',
    shortLabel: 'Chứng nhận',
    description: 'Cấp phát và xác thực Giấy chứng nhận tham gia hoạt động Đoàn - Hội có gắn mã QR chữ ký số.',
    iconName: 'Award',
    minLevel: 1,
    group: 'ORGANIZATION',
    groupLabel: 'Tổ chức & chứng nhận',
    badge: 'Chứng nhận',
    permissionLabel: 'Cấp 1+',
    order: 7,
    visible: false,
    keywords: ['chung nhan', 'giay khen', 'ma qr', 'xac thuc', 'cap chung nhan', 'in chung nhan']
  },

  // Nhóm 7: Quản trị hệ thống
  {
    id: 'accounts',
    label: 'Cấp quyền & tài khoản',
    shortLabel: 'Phân quyền',
    description: 'Phân quyền bảo mật 5 cấp bậc, quản lý tài khoản cán bộ và xét duyệt quyền truy cập Google SSO.',
    iconName: 'Key',
    minLevel: 4,
    group: 'SYSTEM',
    groupLabel: 'Quản trị hệ thống',
    badge: 'Phân quyền',
    permissionLabel: 'Admin Cấp 4',
    order: 8,
    keywords: ['tai khoan', 'phan quyen', 'cap 0-4', 'admin', 'quan tri vien', 'sso google']
  },
  {
    id: 'system-catalogs',
    label: 'Quản lý quy điểm & danh mục',
    shortLabel: 'Quy điểm & cấu hình',
    description: 'Cấu hình khung chấm ĐRL, tiêu chí Sinh viên 5 Tốt, từ điển hệ thống và quy chuẩn Cấp 4.',
    iconName: 'Settings2',
    minLevel: 4,
    group: 'SYSTEM',
    groupLabel: 'Quản trị hệ thống',
    badge: 'Cấu hình Cấp 4',
    permissionLabel: 'Admin Cấp 4',
    order: 9,
    keywords: ['quy diem', 'danh muc', 'tieu chi drl', 'chuan sv5t', 'mang cong tac', 'quy che', 'he thong']
  },
  {
    id: 'drive',
    label: 'Google Drive & hồ sơ',
    shortLabel: 'Drive hồ sơ',
    description: 'Kho lưu trữ tài liệu minh chứng đám mây, tích hợp đồng bộ tự động Google Drive & Workspace.',
    iconName: 'HardDrive',
    minLevel: 1,
    group: 'SYSTEM',
    groupLabel: 'Quản trị hệ thống',
    badge: 'Hồ sơ Drive',
    permissionLabel: 'Cấp 1+',
    order: 13,
    keywords: ['google drive', 'dam may', 'ho so', 'tai lieu', 'minh chung', 'workspace']
  },
  {
    id: 'activity-logs',
    label: 'Nhật ký hệ thống',
    shortLabel: 'Nhật ký',
    description: 'Nhật ký kiểm toán hệ thống, lịch sử thay đổi dữ liệu và giám sát an toàn thông tin.',
    iconName: 'History',
    minLevel: 4,
    group: 'SYSTEM',
    groupLabel: 'Quản trị hệ thống',
    badge: 'Nhật ký',
    permissionLabel: 'Admin Cấp 4',
    order: 14,
    keywords: ['nhat ky', 'audit log', 'lich su', 'giam sat', 'bao mat', 'thao tac du lieu']
  },
  {
    id: 'system-help',
    label: 'Trợ giúp & quy chế NLU',
    shortLabel: 'Trợ giúp',
    description: 'Trung tâm hỗ trợ, hướng dẫn quy chế rèn luyện, quy trình Sinh viên 5 Tốt và tài liệu sử dụng.',
    iconName: 'HelpCircle',
    minLevel: 0,
    group: 'SYSTEM',
    groupLabel: 'Quản trị hệ thống',
    badge: 'Quy chế',
    permissionLabel: 'Công khai (Cấp 0+)',
    order: 15,
    keywords: ['tro giup', 'huong dan', 'quy che', 'ren luyen', 'sv5t', 'support']
  },
  {
    id: 'system-trash',
    label: 'Thùng rác & khôi phục',
    shortLabel: 'Thùng rác',
    description: 'Xem danh sách và khôi phục hoạt động, chứng nhận, dữ liệu đã bị xóa khỏi hệ thống.',
    iconName: 'ShieldAlert',
    minLevel: 4,
    group: 'SYSTEM',
    groupLabel: 'Quản trị hệ thống',
    badge: 'Thùng rác',
    permissionLabel: 'Admin Cấp 4',
    order: 16,
    keywords: ['thung rac', 'khoi phuc', 'xoa', 'trash', 'phuc hoi']
  },
  {
    id: 'system-backup',
    label: 'Sao lưu & khôi phục dữ liệu',
    shortLabel: 'Sao lưu',
    description: 'Xuất bản sao lưu hệ thống JSON/Drive, khôi phục cấu hình và quản lý dữ liệu lưu trữ.',
    iconName: 'CloudUpload',
    minLevel: 4,
    group: 'SYSTEM',
    groupLabel: 'Quản trị hệ thống',
    badge: 'Sao lưu L4',
    permissionLabel: 'Admin Cấp 4',
    order: 17,
    keywords: ['sao luu', 'backup', 'khoi phuc', 'restore', 'du lieu']
  },
  {
    id: 'system-ui-branding',
    label: 'Giao diện & thương hiệu',
    shortLabel: 'Giao diện',
    description: 'Tùy chỉnh logo thương hiệu NLU, liên kết topbar và cấu hình hiển thị menu hệ thống.',
    iconName: 'Sliders',
    minLevel: 4,
    group: 'SYSTEM',
    groupLabel: 'Quản trị hệ thống',
    badge: 'Logo & menu',
    permissionLabel: 'Admin Cấp 4',
    order: 18,
    keywords: ['giao dien', 'dieu huong', 'logo', 'brand', 'menu', 'thuong hieu']
  }
];

export function getCanonicalItem(id: string): NavigationItemConfig | undefined {
  return CANONICAL_NAVIGATION_CONFIG.find(item => item.id === id);
}

export function resolveIcon(iconName?: string): React.ComponentType<{ className?: string }> {
  if (!iconName) return Link;
  return ICON_REGISTRY[iconName] || Link;
}

/**
 * Single source of truth for effective navigation items:
 * Merges custom overrides (from admin Cấp 4) with canonical configuration,
 * sorts by order, and strictly filters by both visibility AND user's active role level.
 */
export function getEffectiveNavItems(
  customNavItems: CustomNavItem[] | undefined,
  userRoleLevel: number = 0
): NavigationItemConfig[] {
  // Build lookup from custom items
  const customMap = new Map<string, CustomNavItem>();
  if (customNavItems && customNavItems.length > 0) {
    customNavItems.forEach(c => customMap.set(c.id, c));
  }

  const merged: NavigationItemConfig[] = [];

  CANONICAL_NAVIGATION_CONFIG.forEach(canonical => {
    const custom = customMap.get(canonical.id);

    // If canonical or custom override explicitly hides it, skip
    if (canonical.visible === false && (!custom || custom.visible !== true)) return;
    if (custom && custom.visible === false) return;

    // Strict role-level check: canonical minLevel is NEVER lowered by custom configuration
    const requiredLevel = Math.max(canonical.minLevel, custom?.minLevel ?? canonical.minLevel);
    if (userRoleLevel < requiredLevel) return;

    // Filter subItems by visibility and userRoleLevel
    const filteredSubItems = canonical.subItems
      ? canonical.subItems.filter(sub => {
          if (sub.visible === false) return false;
          const subLevel = Math.max(sub.minLevel ?? canonical.minLevel, canonical.minLevel);
          return userRoleLevel >= subLevel;
        })
      : undefined;

    merged.push({
      ...canonical,
      label: custom?.label || canonical.label,
      iconName: custom?.iconName || canonical.iconName,
      minLevel: requiredLevel as RoleLevel,
      visible: custom?.visible !== false,
      externalUrl: custom?.externalUrl,
      order: custom?.order !== undefined ? custom.order : canonical.order,
      subItems: filteredSubItems
    });
  });

  // Sort by order ascending
  return merged.sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * Check whether a user with given roleLevel has access to a target tab
 */
export function hasAccessToTab(tabId: string, userRoleLevel: number = 0): boolean {
  // Public tabs
  if (tabId === 'dashboard' || tabId === 'auth-gate') return true;

  // Emulation sub-tabs (require Level 1+)
  if (
    tabId === 'score-roster' ||
    tabId === 'faculty-emulation' ||
    tabId === 'branch-emulation' ||
    tabId === 'club-emulation'
  ) {
    return userRoleLevel >= 1;
  }

  // QR check-in
  if (tabId === 'checkin-qr') {
    return userRoleLevel >= 1;
  }

  // Find canonical or sub-item
  for (const item of CANONICAL_NAVIGATION_CONFIG) {
    if (item.id === tabId) {
      return userRoleLevel >= item.minLevel;
    }
    if (item.subItems) {
      for (const sub of item.subItems) {
        if (sub.targetTab === tabId || sub.id === tabId) {
          const req = Math.max(sub.minLevel ?? item.minLevel, item.minLevel);
          return userRoleLevel >= req;
        }
      }
    }
  }

  // Fallback safe: Level 4 can access everything, guests cannot
  return userRoleLevel >= 4;
}

/**
 * Breadcrumb locator for any tab ID
 */
export function getBreadcrumbPath(tabId: string): {
  groupId: string;
  groupLabel: string;
  parentLabel?: string;
  currentLabel: string;
  currentIcon: string;
  description: string;
} {
  // Check exact canonical match
  const top = CANONICAL_NAVIGATION_CONFIG.find(c => c.id === tabId);
  if (top) {
    return {
      groupId: top.group,
      groupLabel: top.groupLabel,
      currentLabel: top.label,
      currentIcon: top.iconName,
      description: top.description
    };
  }

  // Check sub-tabs mapping
  if (tabId === 'faculty-emulation') {
    return {
      groupId: 'EMULATION',
      groupLabel: 'Thi Đua & Xếp Loại',
      parentLabel: 'Sổ Điểm & Thi Đua Cơ Sở',
      currentLabel: 'Bảng Thi Đua 16 Đoàn Khoa',
      currentIcon: 'Award',
      description: 'Xếp hạng thi đua và chỉ số phong trào 16 Đoàn - Hội Khoa trực thuộc'
    };
  }
  if (tabId === 'branch-emulation') {
    return {
      groupId: 'EMULATION',
      groupLabel: 'Thi Đua & Xếp Loại',
      parentLabel: 'Sổ Điểm & Thi Đua Cơ Sở',
      currentLabel: 'Bảng Thi Đua Cơ Sở Chi Đoàn',
      currentIcon: 'Users',
      description: 'Đánh giá 4 mức chuẩn đoàn viên chi đoàn và phong trào lớp'
    };
  }
  if (tabId === 'club-emulation') {
    return {
      groupId: 'EMULATION',
      groupLabel: 'Thi Đua & Xếp Loại',
      parentLabel: 'Sổ Điểm & Thi Đua Cơ Sở',
      currentLabel: 'Thi Đua 37 CLB / Đội / Nhóm',
      currentIcon: 'Sparkles',
      description: 'Theo dõi 37 Câu lạc bộ, Đội, Nhóm toàn trường'
    };
  }
  if (tabId === 'checkin-qr') {
    return {
      groupId: 'ACTIVITIES',
      groupLabel: 'Quản Lý Hoạt Động',
      parentLabel: 'Quản Lý Hoạt Động',
      currentLabel: 'Điểm Danh Tự Động & Quét QR',
      currentIcon: 'QrCode',
      description: 'Chế độ quét mã QR tức thì ghi nhận sinh viên tham gia'
    };
  }

  // Fallback
  return {
    groupId: 'OVERVIEW',
    groupLabel: 'Tổng Quan Hệ Thống',
    currentLabel: 'NLU Youth 2026',
    currentIcon: 'BarChart3',
    description: 'Hệ thống Quản lý Hoạt động, Điểm Rèn luyện & Xếp loại Đoàn viên ĐH Nông Lâm TP.HCM'
  };
}
