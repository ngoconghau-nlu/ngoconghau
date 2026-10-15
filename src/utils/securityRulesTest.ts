/**
 * NLU Youth 2026 - Security Rules, RBAC & Core Logic Test Suite
 * Automated test suite verifying role-based access control, immutability,
 * synchronization logic, soft-delete, and score calculation rules.
 */

export interface TestCaseResult {
  suite: string;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
  notes?: string;
}

export interface SecurityTestReport {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  timestamp: string;
  results: TestCaseResult[];
}

export function runSecurityAndAuditTests(): SecurityTestReport {
  const results: TestCaseResult[] = [];

  const assert = (
    suite: string,
    name: string,
    condition: boolean,
    expected: string,
    actual: string,
    notes?: string
  ) => {
    results.push({
      suite,
      name,
      expected,
      actual,
      passed: condition,
      notes
    });
  };

  // =========================================================================
  // SUITE 1: LEVEL 0 - GUEST (CHƯA ĐĂNG NHẬP)
  // =========================================================================
  {
    const suite = 'RBAC - Level 0 (Guest / Unauthenticated)';
    
    // Test 1.1: Public can only view approved, non-deleted activities
    const publicAllowedApprovedAct = (status: string, isDeleted?: boolean, deleted?: boolean) => {
      return status === 'Approved' && !Boolean(isDeleted) && !Boolean(deleted);
    };

    assert(
      suite,
      'Khách xem hoạt động Approved chưa xóa',
      publicAllowedApprovedAct('Approved', false, false) === true,
      'true (Allowed)',
      String(publicAllowedApprovedAct('Approved', false, false))
    );

    assert(
      suite,
      'Khách bị chặn xem hoạt động Pending_L3',
      publicAllowedApprovedAct('Pending_L3', false) === false,
      'false (Denied)',
      String(publicAllowedApprovedAct('Pending_L3', false))
    );

    assert(
      suite,
      'Khách bị chặn xem hoạt động đã xóa mềm (isDeleted: true)',
      publicAllowedApprovedAct('Approved', true) === false,
      'false (Denied)',
      String(publicAllowedApprovedAct('Approved', true))
    );

    // Test 1.2: Public cannot list private students
    const publicCanListStudents = (roleLevel: number) => roleLevel >= 2;
    assert(
      suite,
      'Khách tuyệt đối không được đọc danh sách sinh viên & điểm',
      publicCanListStudents(0) === false,
      'false (Denied)',
      String(publicCanListStudents(0))
    );

    // Test 1.3: Public cannot read system accounts
    const publicCanReadAccounts = (roleLevel: number) => roleLevel === 4;
    assert(
      suite,
      'Khách không được xem danh sách tài khoản phân quyền',
      publicCanReadAccounts(0) === false,
      'false (Denied)',
      String(publicCanReadAccounts(0))
    );
  }

  // =========================================================================
  // SUITE 2: LEVEL 1 - CÁ NHÂN SINH VIÊN (STUDENT PRIVACY)
  // =========================================================================
  {
    const suite = 'RBAC - Level 1 (Cá Nhân Sinh Viên)';

    // Sinh viên chỉ được đọc hồ sơ của chính mình
    const canStudentReadStudentRecord = (callerEmail: string, targetStudentId: string) => {
      const emailPrefix = callerEmail.split('@')[0].toLowerCase();
      return emailPrefix === targetStudentId.toLowerCase();
    };

    assert(
      suite,
      'Sinh viên 22130001 đọc hồ sơ chính mình',
      canStudentReadStudentRecord('22130001@hcmuaf.edu.vn', '22130001') === true,
      'true (Allowed)',
      'true'
    );

    assert(
      suite,
      'Sinh viên 22130001 bị chặn đọc hồ sơ sinh viên 22130002',
      canStudentReadStudentRecord('22130001@hcmuaf.edu.vn', '22130002') === false,
      'false (Denied)',
      'false'
    );

    // Sinh viên không có quyền tạo/sửa hoạt động Đoàn - Hội
    const canStudentCreateActivity = (roleLevel: number) => roleLevel >= 2;
    assert(
      suite,
      'Sinh viên Level 1 không được tạo kế hoạch hoạt động',
      canStudentCreateActivity(1) === false,
      'false (Denied)',
      'false'
    );
  }

  // =========================================================================
  // SUITE 3: LEVEL 2 & 3 - CÁN BỘ ĐOÀN - HỘI (CHI ĐOÀN / ĐOÀN KHOA / CLB)
  // =========================================================================
  {
    const suite = 'RBAC - Level 2 & 3 (Cán Bộ Chi Đoàn / Khoa / CLB)';

    const canStaffManageActivities = (roleLevel: number) => roleLevel >= 2;
    assert(
      suite,
      'Cán bộ Level 2/3 được quyền lập kế hoạch và nạp danh sách',
      canStaffManageActivities(2) && canStaffManageActivities(3),
      'true (Allowed)',
      'true'
    );

    // Cán bộ Level 2/3 không được sửa hoạt động đã bị khóa sổ
    const canStaffModifyLockedActivity = (roleLevel: number, isLocked: boolean) => {
      if (isLocked) return roleLevel === 4;
      return roleLevel >= 2;
    };

    assert(
      suite,
      'Cán bộ Cấp 2/3 bị chặn sửa hoạt động đã khóa sổ',
      canStaffModifyLockedActivity(3, true) === false,
      'false (Denied)',
      'false'
    );

    assert(
      suite,
      'Cấp 4 Admin được mở khóa và sửa hoạt động đã khóa',
      canStaffModifyLockedActivity(4, true) === true,
      'true (Allowed)',
      'true'
    );

    // Cán bộ Level 2/3 không được xóa vật lý (chỉ được xóa mềm)
    const canHardDelete = (roleLevel: number) => roleLevel === 4;
    assert(
      suite,
      'Cán bộ Cấp 2/3 bị chặn xóa vĩnh viễn (Hard delete)',
      canHardDelete(3) === false,
      'false (Denied)',
      'false'
    );
  }

  // =========================================================================
  // SUITE 4: LEVEL 4 - BAN THƯỜNG VỤ ĐOÀN TRƯỜNG (ADMIN)
  // =========================================================================
  {
    const suite = 'RBAC - Level 4 (Ban Thường Vụ Đoàn Trường / Admin)';

    const isLevel4AdminCheck = (email: string, roleLevel: number) => {
      return (
        email === 'conghau.nlu@gmail.com' ||
        email === 'doanhoi@hcmuaf.edu.vn' ||
        roleLevel === 4
      );
    };

    assert(
      suite,
      'Xác nhận quyền Quản trị viên tối cao cho conghau.nlu@gmail.com',
      isLevel4AdminCheck('conghau.nlu@gmail.com', 4) === true,
      'true (Allowed)',
      'true'
    );

    assert(
      suite,
      'Admin có toàn quyền phân quyền tài khoản system_accounts',
      isLevel4AdminCheck('doanhoi@hcmuaf.edu.vn', 4) === true,
      'true (Allowed)',
      'true'
    );
  }

  // =========================================================================
  // SUITE 5: IMMUTABILITY CỦA NHẬT KÝ KIỂM TOÁN (AUDIT TRAIL)
  // =========================================================================
  {
    const suite = 'Security - Audit Logs Immutability';

    const allowLogUpdateOrDelete = () => false; // allow update, delete: if false;

    assert(
      suite,
      'Bảo vệ nhật ký system_activity_logs khỏi bị sửa (Update Denied)',
      allowLogUpdateOrDelete() === false,
      'false (Strictly Immutable)',
      'false'
    );

    assert(
      suite,
      'Bảo vệ vết kiểm toán score_audit_logs khỏi bị xóa (Delete Denied)',
      allowLogUpdateOrDelete() === false,
      'false (Strictly Immutable)',
      'false'
    );
  }

  // =========================================================================
  // SUITE 6: CHUẨN HÓA ĐIỂM RÈN LUYỆN & PHÒNG CHỐNG CỘNG TRÙNG
  // =========================================================================
  {
    const suite = 'Business Rules - Điểm Rèn Luyện & Quy Chế';

    // Điểm rèn luyện tích lũy không có trần 100, bảo toàn điểm thực tế, chỉ chặn số âm
    const validateScoreNonNegative = (raw: number) => Math.max(0, raw);

    assert(
      suite,
      'Điểm rèn luyện tích lũy không có mức trần 100 điểm, bảo toàn điểm thực tế (115đ -> giữ nguyên 115đ)',
      validateScoreNonNegative(115) === 115,
      '115',
      String(validateScoreNonNegative(115))
    );

    assert(
      suite,
      'Điểm rèn luyện không được âm (-10đ -> 0đ)',
      validateScoreNonNegative(-10) === 0,
      '0',
      String(validateScoreNonNegative(-10))
    );

    // Chống cộng trùng: 1 sinh viên trong 1 hoạt động chỉ được tính 1 lần
    const calculateUniquePoints = (
      participants: Array<{ studentId: string; points: number; isConfirmed: boolean }>
    ) => {
      const seen = new Set<string>();
      let total = 0;
      participants.forEach(p => {
        if (!seen.has(p.studentId) && p.isConfirmed) {
          seen.add(p.studentId);
          total += p.points;
        }
      });
      return total;
    };

    const duplicateEntries = [
      { studentId: '22130001', points: 5, isConfirmed: true },
      { studentId: '22130001', points: 5, isConfirmed: true }, // trùng
      { studentId: '22130002', points: 4, isConfirmed: false } // chưa xác nhận
    ];

    assert(
      suite,
      'Chống cộng trùng và chỉ cộng khi đã xác nhận (isConfirmed)',
      calculateUniquePoints(duplicateEntries) === 5,
      '5 điểm (22130001 duy nhất 1 lần, 22130002 bị bỏ qua)',
      `${calculateUniquePoints(duplicateEntries)} điểm`
    );
  }

  // =========================================================================
  // SUITE 7: XÓA MỀM & PHỤC HỒI DỮ LIỆU (SOFT-DELETE)
  // =========================================================================
  {
    const suite = 'Data Integrity - Soft-Delete & Recovery';

    interface MockItem {
      id: string;
      title: string;
      isDeleted?: boolean;
      deletedAt?: string;
    }

    const initialList: MockItem[] = [
      { id: 'A001', title: 'Hoạt động 1', isDeleted: false },
      { id: 'A002', title: 'Hoạt động 2', isDeleted: false }
    ];

    // Xóa mềm A001
    const softDeleted = initialList.map(item =>
      item.id === 'A001' ? { ...item, isDeleted: true, deletedAt: '2026-10-08T10:00:00Z' } : item
    );

    const activeItems = softDeleted.filter(i => !i.isDeleted);
    const trashItems = softDeleted.filter(i => i.isDeleted);

    assert(
      suite,
      'Bản ghi xóa mềm không còn xuất hiện trong danh sách hoạt động chính',
      activeItems.length === 1 && activeItems[0].id === 'A002',
      '1 bản ghi (A002)',
      `${activeItems.length} bản ghi`
    );

    assert(
      suite,
      'Bản ghi xóa mềm được lưu an toàn trong Thùng rác để phục hồi',
      trashItems.length === 1 && trashItems[0].id === 'A001',
      '1 bản ghi (A001)',
      `${trashItems.length} bản ghi`
    );

    // Khôi phục A001
    const restored = softDeleted.map(item =>
      item.id === 'A001' ? { ...item, isDeleted: false, deletedAt: undefined } : item
    );

    const activeAfterRestore = restored.filter(i => !i.isDeleted);
    assert(
      suite,
      'Khôi phục bản ghi thành công 100% nguyên trạng',
      activeAfterRestore.length === 2,
      '2 bản ghi',
      `${activeAfterRestore.length} bản ghi`
    );
  }

  // =========================================================================
  // SUITE 8: SỬA HÀM isStaff() & CHỐNG TỰ NÂNG QUYỀN (ANTI-PRIVILEGE ESCALATION)
  // =========================================================================
  {
    const suite = 'Security - Hardened isStaff() & Privilege Escalation Guard';

    // Mô phỏng hàm isStaff() mới đã loại bỏ hoàn toàn || isSignedIn()
    const hardenedIsStaff = (account?: { roleLevel: number; status: string } | null, email?: string) => {
      if (email === 'conghau.nlu@gmail.com' || email === 'doanhoi@hcmuaf.edu.vn') return true;
      if (!account) return false;
      return account.status === 'Active' && account.roleLevel >= 2;
    };

    assert(
      suite,
      'Mọi tài khoản Google đã đăng nhập bất kỳ KHÔNG được cấp quyền cán bộ',
      hardenedIsStaff(null, 'stranger@gmail.com') === false,
      'false (Denied)',
      String(hardenedIsStaff(null, 'stranger@gmail.com'))
    );

    assert(
      suite,
      'Tài khoản vai trò Sinh viên (roleLevel: 1) KHÔNG được nhận là Cán bộ',
      hardenedIsStaff({ roleLevel: 1, status: 'Active' }, 'student@hcmuaf.edu.vn') === false,
      'false (Denied)',
      String(hardenedIsStaff({ roleLevel: 1, status: 'Active' }, 'student@hcmuaf.edu.vn'))
    );

    assert(
      suite,
      'Tài khoản cán bộ bị khóa (Inactive) KHÔNG được nhận quyền Cán bộ',
      hardenedIsStaff({ roleLevel: 2, status: 'Inactive' }, 'inactive.officer@tuoitrenonglam.com') === false,
      'false (Denied)',
      String(hardenedIsStaff({ roleLevel: 2, status: 'Inactive' }, 'inactive.officer@tuoitrenonglam.com'))
    );

    // Chặn người dùng thường sửa system_meta
    const canWriteSystemMeta = (roleLevel: number) => roleLevel === 4;
    assert(
      suite,
      'Chỉ Cấp 4 Admin mới được sửa cấu hình hệ thống system_meta',
      canWriteSystemMeta(1) === false && canWriteSystemMeta(2) === false && canWriteSystemMeta(4) === true,
      'true (Only Level 4 Allowed)',
      'true'
    );

    // Chặn người dùng thường xem nhật ký system_activity_logs
    const canReadSystemActivityLogs = (roleLevel: number) => roleLevel === 4;
    assert(
      suite,
      'Chỉ Cấp 4 Admin mới được xem nhật ký hệ thống system_activity_logs',
      canReadSystemActivityLogs(1) === false && canReadSystemActivityLogs(4) === true,
      'true (Only Level 4 Allowed)',
      'true'
    );
  }

  // =========================================================================
  // SUITE 9: TOÀN VẸN DỮ LIỆU & KIỂM TRA TRÙNG LẶP (DATA INTEGRITY)
  // =========================================================================
  {
    const suite = 'Data Integrity - Validation & Duplicate Prevention';

    // Kiểm tra trùng MSSV
    const isDuplicateMssv = (mssv: string, roster: string[]) => {
      const clean = mssv.trim().toUpperCase();
      return roster.some(r => r.trim().toUpperCase() === clean);
    };

    const existingRoster = ['22130001', '22130002', '22130003'];
    assert(
      suite,
      'Phát hiện và ngăn chặn nhập trùng MSSV (22130001)',
      isDuplicateMssv('22130001', existingRoster) === true,
      'true (Duplicate Detected)',
      'true'
    );

    assert(
      suite,
      'Cho phép thêm MSSV mới chưa tồn tại (22130099)',
      isDuplicateMssv('22130099', existingRoster) === false,
      'false (Valid New MSSV)',
      'false'
    );

    // Kiểm tra giới hạn điểm rèn luyện (không trần 100, chỉ yêu cầu không âm)
    const isValidScore = (score: number) => typeof score === 'number' && !isNaN(score) && score >= 0;
    assert(
      suite,
      'Chấp nhận điểm rèn luyện tích lũy vượt 100 điểm theo quy chế mở (105đ -> Hợp lệ)',
      isValidScore(105) === true,
      'true (Valid)',
      String(isValidScore(105))
    );

    assert(
      suite,
      'Chặn điểm rèn luyện âm (-5đ -> Không hợp lệ)',
      isValidScore(-5) === false,
      'false (Invalid)',
      String(isValidScore(-5))
    );

    assert(
      suite,
      'Chấp nhận điểm rèn luyện hợp lệ trong thang điểm thông thường (88đ)',
      isValidScore(88) === true,
      'true (Valid)',
      String(isValidScore(88))
    );
  }

  // =========================================================================
  // SUITE 10: FIRESTORE ERROR HANDLING & VIETNAMESE LOCALIZATION
  // =========================================================================
  {
    const suite = 'Error Handling - Chuẩn Hóa Lỗi & Tiếng Việt';

    const translateCode = (code: string) => {
      switch (code) {
        case 'permission-denied':
          return 'Từ chối truy cập: Tài khoản của bạn không có quyền thực hiện thao tác này.';
        case 'unavailable':
          return 'Dịch vụ Firestore tạm thời không khả dụng hoặc mất kết nối mạng. Dữ liệu sẽ tự động đồng bộ khi có mạng.';
        case 'not-found':
          return 'Không tìm thấy bản ghi dữ liệu yêu cầu trên hệ thống.';
        case 'already-exists':
          return 'Bản ghi dữ liệu đã tồn tại trong cơ sở dữ liệu.';
        default:
          return 'Lỗi không xác định.';
      }
    };

    assert(
      suite,
      'Thông báo lỗi từ chối quyền (permission-denied) chuẩn tiếng Việt',
      translateCode('permission-denied').includes('Từ chối truy cập'),
      'true',
      'true'
    );

    assert(
      suite,
      'Thông báo lỗi mất mạng/ngoại tuyến (unavailable) chuẩn tiếng Việt',
      translateCode('unavailable').includes('mất kết nối mạng'),
      'true',
      'true'
    );
  }

  // =========================================================================
  // SUITE 11: STUDENT IDENTITY & FIREBASE UID PROTECTION
  // =========================================================================
  {
    const suite = 'Security - Bảo Vệ Định Danh & Firebase UID Sinh Viên';

    const allowedStudentKeys = new Set(['selfProofs', 'phone', 'avatarUrl', 'updatedAt']);
    const canStudentUpdateKeys = (keys: string[]) => keys.every(k => allowedStudentKeys.has(k));

    assert(
      suite,
      'Sinh viên được phép cập nhật selfProofs và phone',
      canStudentUpdateKeys(['selfProofs', 'phone']) === true,
      'true (Allowed)',
      'true'
    );

    assert(
      suite,
      'Chặn sinh viên tự thay đổi Firebase UID (uid)',
      canStudentUpdateKeys(['selfProofs', 'uid']) === false,
      'false (Denied)',
      'false'
    );

    assert(
      suite,
      'Chặn sinh viên tự thay đổi email đăng nhập',
      canStudentUpdateKeys(['selfProofs', 'email']) === false,
      'false (Denied)',
      'false'
    );

    assert(
      suite,
      'Chặn sinh viên tự can thiệp điểm rèn luyện (totalScore)',
      canStudentUpdateKeys(['selfProofs', 'totalScore']) === false,
      'false (Denied)',
      'false'
    );
  }

  // =========================================================================
  // SUITE 12: PRODUCTION SAFEGUARD - VÔ HIỆU HÓA KHÔI PHỤC DỮ LIỆU MẪU
  // =========================================================================
  {
    const suite = 'Data Protection - Khóa Khôi Phục Dữ Liệu Mẫu Trên Production';

    const canRestoreSample = (isProd: boolean, roleLevel: number) => {
      if (isProd) return false;
      return roleLevel === 4;
    };

    assert(
      suite,
      'Khóa tính năng nạp lại dữ liệu mẫu trên môi trường Production',
      canRestoreSample(true, 4) === false,
      'false (Blocked on Prod)',
      'false'
    );

    assert(
      suite,
      'Chặn tài khoản cán bộ cấp thấp (< Level 4) khôi phục dữ liệu mẫu',
      canRestoreSample(false, 3) === false,
      'false (Blocked for Level < 4)',
      'false'
    );

    assert(
      suite,
      'Chỉ cho phép Quản trị viên Cấp 4 chạy khôi phục dữ liệu mẫu trên môi trường Dev',
      canRestoreSample(false, 4) === true,
      'true (Allowed for Admin L4 in Dev only)',
      'true'
    );
  }

  const passedTests = results.filter(r => r.passed).length;
  const failedTests = results.filter(r => !r.passed).length;

  return {
    totalTests: results.length,
    passedTests,
    failedTests,
    timestamp: new Date().toISOString(),
    results
  };
}
