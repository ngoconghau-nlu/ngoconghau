import {
  ActivitySubmission,
  FilterAcademicYear,
  FilterActivityType,
  FilterSemester,
  SemesterOption,
  ActivityTypeOption
} from '../types';

export const ACADEMIC_YEARS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Tất cả năm học' },
  { value: '2026-2027', label: 'Năm học 2026-2027 (Hiện tại)' },
  { value: '2025-2026', label: 'Năm học 2025-2026' },
  { value: '2024-2025', label: 'Năm học 2024-2025' },
];

export const SEMESTERS: { value: FilterSemester; label: string; shortLabel: string }[] = [
  { value: 'ALL', label: 'Tất cả học kỳ', shortLabel: 'Tất cả HK' },
  { value: 'HK1', label: 'Học kỳ 1 (HK1)', shortLabel: 'HK1' },
  { value: 'HK2', label: 'Học kỳ 2 (HK2)', shortLabel: 'HK2' },
  { value: 'HK_HE', label: 'Học kỳ Hè (HK Hè)', shortLabel: 'HK Hè' },
];

export const ACTIVITY_TYPES: {
  value: FilterActivityType;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    value: 'ALL',
    label: 'Tất cả loại hình (Đoàn & Hội)',
    shortLabel: 'Tất cả',
    description: 'Bao gồm toàn bộ hoạt động Đoàn TN, Hội SV và liên tịch',
  },
  {
    value: 'DOAN',
    label: 'Hoạt động Đoàn (Đoàn TNCS HCM)',
    shortLabel: 'Đoàn TN',
    description: 'Chính trị, công tác tổ chức, phong trào Đoàn thanh niên',
  },
  {
    value: 'HOI',
    label: 'Hoạt động Hội (Hội Sinh viên)',
    shortLabel: 'Hội SV',
    description: 'Phong trào Sinh viên 5 tốt, học thuật, NCKH, đời sống',
  },
  {
    value: 'DOAN_HOI',
    label: 'Liên tịch Phối hợp Đoàn - Hội',
    shortLabel: 'Đoàn - Hội',
    description: 'Chương trình phối hợp toàn diện giữa Đoàn trường & Hội SV',
  },
];

/**
 * Suy ra năm học chính thức từ planYear (ưu tiên cao nhất) hoặc tính toán từ lịch năm học chuẩn:
 * Năm học YYYY-(YYYY+1) kéo dài từ 01/09/YYYY đến 31/08/(YYYY+1).
 * Không dùng OR với năm dương lịch để tránh rò rỉ hoạt động giữa các năm học.
 */
export function resolveActivityAcademicYear(act: Partial<ActivitySubmission>): { academicYear: string; isInferred: boolean } {
  // 1. Ưu tiên planYear hợp lệ (định dạng YYYY-YYYY hoặc chuỗi chứa YYYY-YYYY như "Năm học 2026-2027")
  if (act.planYear && act.planYear.trim()) {
    const match = act.planYear.match(/(\d{4}-\d{4})/);
    if (match) {
      return { academicYear: match[1], isInferred: false };
    }
  }

  // 2. Nếu thiếu planYear, suy luận bằng lịch năm học cấu hình (từ ngày tổ chức)
  if (act.startDate && act.startDate.trim()) {
    const d = new Date(act.startDate);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = d.getMonth() + 1; // 1-12
      // Từ tháng 9 trở đi thuộc nửa đầu năm học YYYY-(YYYY+1)
      if (month >= 9) {
        return { academicYear: `${year}-${year + 1}`, isInferred: true };
      }
      // Từ tháng 1 đến tháng 8 thuộc nửa sau năm học (YYYY-1)-YYYY
      return { academicYear: `${year - 1}-${year}`, isInferred: true };
    }
  }

  return { academicYear: '2026-2027', isInferred: true };
}

/**
 * Suy đoán hoặc lấy học kỳ của hoạt động
 * Năm học: HK1 (01/09 - 31/01), HK2 (01/02 - 30/06), HK Hè (01/07 - 31/08).
 * Nếu ngày không hợp lệ, trả về null thay vì mặc định sai lệch HK1.
 */
export function getActivitySemester(act: Partial<ActivitySubmission>): SemesterOption | null {
  if (act.semester) return act.semester;

  if (act.startDate && act.startDate.trim()) {
    try {
      const d = new Date(act.startDate);
      if (!isNaN(d.getTime())) {
        const month = d.getMonth() + 1; // 1-12
        // Tháng 9 -> 1: HK1
        if (month >= 9 || month === 1) return 'HK1';
        // Tháng 2 -> 6: HK2
        if (month >= 2 && month <= 6) return 'HK2';
        // Tháng 7 -> 8: HK Hè
        if (month >= 7 && month <= 8) return 'HK_HE';
      }
    } catch {
      // Ngày không hợp lệ
    }
  }

  return null;
}

/**
 * Suy đoán hoặc lấy loại hình hoạt động (Đoàn / Hội / Liên tịch)
 */
export function getActivityType(act: Partial<ActivitySubmission>): ActivityTypeOption {
  if (act.activityType) return act.activityType;

  const hasDoan = Boolean(act.doanProgramId && act.doanProgramId.trim() !== '');
  const hasHoi = Boolean(act.hoiProgramId && act.hoiProgramId.trim() !== '');

  if (hasDoan && hasHoi) return 'DOAN_HOI';
  if (hasDoan && !hasHoi) return 'DOAN';
  if (!hasDoan && hasHoi) return 'HOI';

  // Kiểm tra tên đơn vị
  const orgName = (act.orgName || '').toLowerCase();
  const hostLevel = (act.hostLevelName || '').toLowerCase();

  if (orgName.includes('hội sinh viên') || hostLevel.includes('hội sinh viên')) {
    return 'HOI';
  }
  if (orgName.includes('đoàn') || hostLevel.includes('đoàn')) {
    return 'DOAN';
  }

  return 'DOAN_HOI';
}

/**
 * Kiểm tra xem một hoạt động có thỏa mãn các tiêu chí lọc hay không
 */
export function matchActivityFilters(
  act: ActivitySubmission,
  filters: {
    academicYear?: FilterAcademicYear;
    semester?: FilterSemester;
    activityType?: FilterActivityType;
    searchTerm?: string;
  }
): boolean {
  // Lọc Năm học: Ưu tiên planYear hợp lệ, KHÔNG dùng OR với năm dương lịch
  if (filters.academicYear && filters.academicYear !== 'ALL') {
    const resolved = resolveActivityAcademicYear(act);
    if (resolved.academicYear !== filters.academicYear) {
      return false;
    }
  }

  // Lọc Học kỳ
  if (filters.semester && filters.semester !== 'ALL') {
    const actSemester = getActivitySemester(act);
    if (!actSemester || actSemester !== filters.semester) return false;
  }

  // Lọc Loại hình hoạt động (Đoàn/Hội)
  if (filters.activityType && filters.activityType !== 'ALL') {
    const actType = getActivityType(act);
    if (filters.activityType === 'DOAN') {
      if (actType !== 'DOAN' && actType !== 'DOAN_HOI') return false;
    } else if (filters.activityType === 'HOI') {
      if (actType !== 'HOI' && actType !== 'DOAN_HOI') return false;
    } else if (filters.activityType === 'DOAN_HOI') {
      if (actType !== 'DOAN_HOI') return false;
    }
  }

  // Tìm kiếm
  if (filters.searchTerm && filters.searchTerm.trim() !== '') {
    const q = filters.searchTerm.trim().toLowerCase();
    const matches =
      (act.id && act.id.toLowerCase().includes(q)) ||
      (act.title && act.title.toLowerCase().includes(q)) ||
      (act.orgName && act.orgName.toLowerCase().includes(q)) ||
      (act.managerName && act.managerName.toLowerCase().includes(q)) ||
      (act.branchClass && act.branchClass.toLowerCase().includes(q));
    if (!matches) return false;
  }

  return true;
}

/**
 * Trả về thông tin hiển thị huy hiệu học kỳ
 */
export function getSemesterBadge(semester: SemesterOption | null | undefined): {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
} {
  switch (semester) {
    case 'HK1':
      return {
        label: 'HK1',
        bgClass: 'bg-blue-50',
        textClass: 'text-blue-700',
        borderClass: 'border-blue-200',
      };
    case 'HK2':
      return {
        label: 'HK2',
        bgClass: 'bg-indigo-50',
        textClass: 'text-indigo-700',
        borderClass: 'border-indigo-200',
      };
    case 'HK_HE':
      return {
        label: 'HK Hè',
        bgClass: 'bg-amber-50',
        textClass: 'text-amber-800',
        borderClass: 'border-amber-200',
      };
    default:
      return {
        label: semester ? String(semester) : 'Chưa xếp HK',
        bgClass: 'bg-slate-50',
        textClass: 'text-slate-600',
        borderClass: 'border-slate-200',
      };
  }
}

/**
 * Trả về thông tin hiển thị huy hiệu loại hình Đoàn / Hội
 */
export function getActivityTypeBadge(type: ActivityTypeOption): {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
} {
  switch (type) {
    case 'DOAN':
      return {
        label: 'Đoàn TN',
        bgClass: 'bg-red-50',
        textClass: 'text-red-700',
        borderClass: 'border-red-200',
      };
    case 'HOI':
      return {
        label: 'Hội SV',
        bgClass: 'bg-teal-50',
        textClass: 'text-teal-700',
        borderClass: 'border-teal-200',
      };
    case 'DOAN_HOI':
    default:
      return {
        label: 'Đoàn - Hội',
        bgClass: 'bg-purple-50',
        textClass: 'text-purple-700',
        borderClass: 'border-purple-200',
      };
  }
}
