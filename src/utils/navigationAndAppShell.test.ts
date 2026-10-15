/**
 * Comprehensive Automated Tests for Navigation Architecture,
 * RBAC Permissions, Search, and App Shell Integrity (NLU Youth 2026)
 */

import {
  CANONICAL_NAVIGATION_CONFIG,
  NAVIGATION_GROUPS,
  getEffectiveNavItems,
  hasAccessToTab,
  getBreadcrumbPath,
  resolveIcon
} from '../config/navigationConfig';
import { searchMatches, removeVietnameseTones } from './textUtils';
import { CustomNavItem } from '../types';

export function runNavigationAndAppShellTests() {
  const tests: Array<{ name: string; passed: boolean; message?: string }> = [];

  // 1. Kiểm tra không có ID điều hướng trùng lặp
  const allIds = new Set<string>();
  let hasDuplicateId = false;
  let dupIdName = '';

  CANONICAL_NAVIGATION_CONFIG.forEach(item => {
    if (allIds.has(item.id)) {
      hasDuplicateId = true;
      dupIdName = item.id;
    }
    allIds.add(item.id);

    if (item.subItems) {
      item.subItems.forEach(sub => {
        if (allIds.has(sub.id)) {
          hasDuplicateId = true;
          dupIdName = sub.id;
        }
        allIds.add(sub.id);
      });
    }
  });

  tests.push({
    name: '1. Không có ID điều hướng trùng lặp trong toàn bộ cấu hình canonical',
    passed: !hasDuplicateId,
    message: hasDuplicateId ? `Trùng ID: ${dupIdName}` : undefined
  });

  // 2. Kiểm tra đủ 7 nhóm nghiệp vụ theo chuẩn Master Prompt
  const expectedGroups = ['OVERVIEW', 'TARGETS', 'ACTIVITIES', 'STUDENT', 'EMULATION', 'ORGANIZATION', 'SYSTEM'];
  const definedGroupIds = NAVIGATION_GROUPS.map(g => g.id);
  const allGroupsPresent = expectedGroups.every(g => definedGroupIds.includes(g as any));

  tests.push({
    name: '2. Đầy đủ 7 nhóm nghiệp vụ chuẩn hoá theo Master Prompt (1-7)',
    passed: allGroupsPresent && NAVIGATION_GROUPS.length === 7
  });

  // 3. Phân quyền vai trò: Khách (Cấp 0) không được truy cập các phân hệ Cấp 4 (accounts, system-catalogs, activity-logs)
  const guestAccountsAccess = hasAccessToTab('accounts', 0);
  const guestCatalogsAccess = hasAccessToTab('system-catalogs', 0);
  const guestDashboardAccess = hasAccessToTab('dashboard', 0);
  const adminAccountsAccess = hasAccessToTab('accounts', 4);

  tests.push({
    name: '3. Kiểm tra phân quyền RBAC: Cấp 0 bị chặn vào Admin tabs, Cấp 4 được phép',
    passed: !guestAccountsAccess && !guestCatalogsAccess && guestDashboardAccess && adminAccountsAccess
  });

  // 4. Menu ẩn (visible: false) không xuất hiện trong effective menu của người dùng
  const mockCustomItems: CustomNavItem[] = [
    { id: 'dashboard', label: 'Dashboard', iconName: 'BarChart3', visible: true, minLevel: 0, order: 1 },
    { id: 'targets', label: 'Chỉ tiêu', iconName: 'Target', visible: false, minLevel: 1, order: 2 } // Ẩn mục targets
  ];
  const effectiveItemsWithHidden = getEffectiveNavItems(mockCustomItems, 4);
  const targetsFound = effectiveItemsWithHidden.some(item => item.id === 'targets');

  tests.push({
    name: '4. Menu bị ẩn (visible: false) không xuất hiện trong danh sách điều hướng hiệu lực',
    passed: !targetsFound
  });

  // 5. Cấp quyền phân bậc trong getEffectiveNavItems: Sinh viên (Cấp 1) không thấy Accounts (Cấp 4)
  const studentEffectiveItems = getEffectiveNavItems(undefined, 1);
  const hasAccountsForStudent = studentEffectiveItems.some(item => item.id === 'accounts');
  const hasDashboardForStudent = studentEffectiveItems.some(item => item.id === 'dashboard');

  tests.push({
    name: '5. getEffectiveNavItems tự động lọc bỏ các phân hệ vượt quá cấp bậc người dùng',
    passed: !hasAccountsForStudent && hasDashboardForStudent
  });

  // 6. Sub-items phân giải chính xác targetTab và subRouteAction
  const targetItem = CANONICAL_NAVIGATION_CONFIG.find(i => i.id === 'targets');
  const targetKpiSub = targetItem?.subItems?.find(s => s.id === 'targets-kpi');
  const targetUnitsSub = targetItem?.subItems?.find(s => s.id === 'targets-units');
  const actItem = CANONICAL_NAVIGATION_CONFIG.find(i => i.id === 'activities');
  const actQrSub = actItem?.subItems?.find(s => s.id === 'activities-qr');

  tests.push({
    name: '6. Menu con trỏ đúng targetTab (targets-kpi -> overview, targets-units -> hierarchical, qr -> checkin-qr)',
    passed: Boolean(
      targetKpiSub?.targetTab === 'targets' &&
      targetKpiSub?.subRouteAction === 'overview' &&
      targetUnitsSub?.targetTab === 'targets' &&
      targetUnitsSub?.subRouteAction === 'hierarchical' &&
      actQrSub?.targetTab === 'checkin-qr'
    )
  });

  // 7. Tìm kiếm tiếng Việt không dấu (Accent-insensitive matching)
  const match1 = searchMatches('Điểm Danh Hoạt Động', 'diem danh');
  const match2 = searchMatches('Tiêu chuẩn Sinh viên 5 tốt', 'sinh vien 5 tot');
  const match3 = searchMatches('Giấy chứng nhận điện tử', 'chung nhan');
  const match4 = searchMatches('Kế hoạch & Chỉ tiêu', 'chi tieu');

  tests.push({
    name: '7. Tìm kiếm thông minh hỗ trợ tiếng Việt không dấu (diem danh, sv5t, chung nhan, chi tieu)',
    passed: match1 && match2 && match3 && match4
  });

  // 8. Định vị Breadcrumb chính xác cho các phân hệ chính và phân hệ con
  const bFaculty = getBreadcrumbPath('faculty-emulation');
  const bQr = getBreadcrumbPath('checkin-qr');
  const bTargets = getBreadcrumbPath('targets');

  tests.push({
    name: '8. getBreadcrumbPath sinh đường dẫn đúng nhóm và tiêu đề phân hệ',
    passed:
      bFaculty.groupId === 'EMULATION' &&
      bFaculty.parentLabel === 'Sổ Điểm & Thi Đua Cơ Sở' &&
      bQr.groupId === 'ACTIVITIES' &&
      bTargets.groupId === 'TARGETS'
  });

  // 9. Bộ Icon registry phân giải hợp lệ, không trả về null/undefined
  const iconDash = resolveIcon('BarChart3');
  const iconTarget = resolveIcon('Target');
  const iconFallback = resolveIcon('NonExistentIcon');

  tests.push({
    name: '9. resolveIcon trả về component Lucide hợp lệ và fallback an toàn khi gặp icon lạ',
    passed: Boolean(iconDash) && Boolean(iconTarget) && Boolean(iconFallback)
  });

  // 10. Tùy chỉnh nhãn trong customNavItems không làm sai lệch ID và targetTab gốc
  const customOverride: CustomNavItem[] = [
    { id: 'dashboard', label: 'Bàn Làm Việc Tổng', iconName: 'Compass', visible: true, minLevel: 0, order: 1 }
  ];
  const mergedItems = getEffectiveNavItems(customOverride, 0);
  const overriddenDash = mergedItems.find(i => i.id === 'dashboard');

  tests.push({
    name: '10. Tùy chỉnh menu (Cấp 4) cập nhật nhãn mới nhưng bảo toàn id, quyền và thứ tự hợp lệ',
    passed: overriddenDash?.label === 'Bàn Làm Việc Tổng' && overriddenDash?.id === 'dashboard'
  });

  // 11. Custom config cannot lower canonical minLevel security boundary
  const maliciousCustomItems: CustomNavItem[] = [
    { id: 'accounts', label: 'Tài khoản', iconName: 'Key', visible: true, minLevel: 0, order: 1 } // Lowering accounts to Level 0
  ];
  const level1Items = getEffectiveNavItems(maliciousCustomItems, 1);
  const accountsExposedToLevel1 = level1Items.some(i => i.id === 'accounts');

  tests.push({
    name: '11. Cấu hình menu tùy chỉnh KHÔNG ĐƯỢC PHÉP hạ thấp mức quyền tối thiểu của chức năng (accounts giữ nguyên Cấp 4)',
    passed: !accountsExposedToLevel1
  });

  const passed = tests.filter(t => t.passed).length;
  const failed = tests.filter(t => !t.passed).length;

  return {
    total: tests.length,
    passed,
    failed,
    tests
  };
}
