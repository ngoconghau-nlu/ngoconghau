/**
 * Types and Data Contracts for NLU Youth 2026
 * Hệ thống Quản lý Hoạt động, Điểm Rèn luyện và Xếp loại Đoàn viên / Sinh viên
 * Đại học Nông Lâm TP.HCM - Năm học 2026-2027
 */

export type RoleLevel = 0 | 1 | 2 | 3 | 4;
// 0: Khách (Chưa đăng nhập / Guest)
// 1: Cá nhân Sinh viên
// 2: Cấp Chi đoàn / Tổ / Đội / Nhóm
// 3: Cấp Đoàn Khoa / CLB Trực thuộc Trường
// 4: Cấp Trường (Admin toàn quyền)

export interface UserRole {
  roleId: string;
  roleLevel: RoleLevel;
  roleName: string;
  orgCode?: string;
  orgName?: string;
  classCode?: string;
  studentId?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  studentId?: string; // MSSV
  facultyCode?: string;
  classCode?: string;
  avatarUrl?: string;
  isAuthenticated: boolean;
  currentRole: UserRole;
  availableRoles: UserRole[];
}

export interface SystemUserAccount {
  id: string;
  email: string;
  fullName: string;
  roleLevel: RoleLevel;
  orgCode: string;
  orgName: string;
  classCode?: string;
  studentId?: string;
  assignedBy?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  version?: number;
  updatedAt?: string;
  updatedBy?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletedReason?: string;
}

export type OrgType = 'TRUONG' | 'KHOA' | 'CLB_TRUONG' | 'CLB_KHOA' | 'CHI_DOAN';
export type HostLevel = 'A' | 'B';

// Phân loại danh mục: Câu Lạc Bộ, Tổ, Đội, Nhóm
export type ClubCategory = 'CLB' | 'TO' | 'DOI' | 'NHOM';

export const CLUB_CATEGORY_LABELS: Record<ClubCategory, string> = {
  CLB: 'Câu Lạc Bộ',
  TO: 'Tổ',
  DOI: 'Đội',
  NHOM: 'Nhóm'
};

export function getClubCategory(org?: Partial<Organization> | string, name?: string): { category: ClubCategory; label: string } {
  if (typeof org === 'object' && org?.category) {
    return { category: org.category, label: CLUB_CATEGORY_LABELS[org.category] || 'Câu Lạc Bộ' };
  }
  const code = (typeof org === 'string' ? org : org?.code || '').toUpperCase();
  const orgName = (typeof org === 'object' ? org?.name : name) || '';

  if (code.startsWith('DOI_') || orgName.toLowerCase().startsWith('đội')) {
    return { category: 'DOI', label: 'Đội' };
  }
  if (code.startsWith('TO_') || code === 'HGD' || orgName.toLowerCase().startsWith('tổ')) {
    return { category: 'TO', label: 'Tổ' };
  }
  if (code.startsWith('NHOM_') || code.startsWith('HOD_') || orgName.toLowerCase().startsWith('nhóm')) {
    return { category: 'NHOM', label: 'Nhóm' };
  }
  return { category: 'CLB', label: 'Câu Lạc Bộ' };
}

export interface Organization {
  id: number;
  code: string;
  name: string;
  type: OrgType;
  category?: ClubCategory; // Phân loại danh mục: 'CLB' | 'TO' | 'DOI' | 'NHOM'
  categoryName?: string; // Tên hiển thị danh mục: "Câu Lạc Bộ" | "Tổ" | "Đội" | "Nhóm"
  hostLevel: HostLevel; // A hoặc B
  hostLevelName: string; // "Đoàn, Hội trường và tương đương", "Khoa", "CLB cấp trường", etc.
  hostLevelScorePoint: number; // Mức điểm Cấp đăng cai (1 - 6)
  email1: string;
  email2?: string;
  facultyCode?: string; // Trường dữ liệu Thuộc Khoa (dành cho CLB, tổ, đội nhóm cấp Khoa)
  parentCode?: string;
  activityCount?: number;
}

export type ChiDoanRank =
  | 'Hoàn thành xuất sắc nhiệm vụ'
  | 'Hoàn thành tốt nhiệm vụ'
  | 'Hoàn thành nhiệm vụ'
  | 'Không hoàn thành nhiệm vụ';

export interface BranchClass {
  id: string;
  code: string;
  name: string;
  facultyCode: string;
  academicYear: string; // e.g. "2024-2028"
  studentCount?: number;
  qualityRank?: ChiDoanRank; // Xếp loại chất lượng chi đoàn (4 mức chuẩn)
}

export type ActivityStatus = 'Pending_L3' | 'Pending_L4' | 'Approved' | 'Rejected' | 'Request_Edit';
export type PlanYearOption = 'Trong kế hoạch năm' | 'Nằm ngoài kế hoạch năm';

export type ParticipantRoleType =
  | 'Giải Nhất'
  | 'Giải Nhì'
  | 'Giải Ba'
  | 'Ban Tổ chức'
  | 'Cộng tác viên'
  | 'Tham gia dự thi vòng 1 trực tiếp (offline)'
  | 'Tham dự'
  | 'Tham gia dự thi 1 vòng trực tuyến (online)';

export interface ActivityParticipantEntry {
  studentId: string;
  fullName: string;
  classCode?: string;
  facultyCode?: string;
  role: ParticipantRoleType;
  pointsAwarded: number;
  recordedAt: string;
  attendanceStatus?: 'Registered' | 'Confirmed' | 'Absent';
  isConfirmed?: boolean;
}

export interface ActivitySubmission {
  id: string; // Mã hoạt động tự động: Cấp A -> A001, A002... Cấp B -> B001, B002...
  title: string; // 1. Tên chương trình
  orgCode: string; // 2. Đơn vị tổ chức (Lookup D.2)
  orgName: string;
  branchClass?: string; // 3. Chi đoàn tổ chức (hiện khi chọn Khoa, ẩn ở CLB/Trường)
  
  // Thành phần 1: Điểm Quy mô đối tượng tham gia (1-6)
  scaleId: number;
  scaleName: string;
  scalePoints: number; // 1-6
  
  // Thành phần 2: Điểm Số lượng người tham gia trong CT chính thức (1-6, mặc định 0 nếu chưa tải danh sách)
  officialParticipantCount: number; // Đếm từ file Excel
  participantScorePoints: number; // 0..6
  
  // Thành phần 3: Điểm Cấp đăng cai (1-6)
  hostLevel: HostLevel; // 'A' | 'B'
  hostLevelId: number; // 1-6
  hostLevelName: string;
  hostLevelPoints: number; // 1-6
  
  // Tổng điểm phân cấp chương trình = Quy mô + Số lượng + Cấp đăng cai
  totalLevelScore: number;
  programLevel: number; // 1, 2, 3, 4
  
  startDate: string; // 5. Ngày tổ chức
  endDate?: string;
  completedDate?: string; // Ngày hoàn thành hoạt động thực tế
  managerName: string; // 6. Người phụ trách (Lookup Sinh viên)
  managerStudentId?: string;
  signedDocUrl: string; // 7. Link VB trình ký (Google Drive URL)
  proofArticleUrl: string; // 8. Link Bài viết minh chứng
  needsCertificate: boolean; // 9. Nhu cầu cấp GCN cấp trường (Yes/No)
  planYear: string; // Năm học: 2026-2027
  planYearOption: PlanYearOption; // 10. "Trong kế hoạch năm" hoặc "Nằm ngoài kế hoạch năm"
  drlCriteriaId: string; // 11. Tiêu chí ĐRL (A1 - E3)
  drlCriteriaText: string;
  sv5tCriteriaId: string; // 12. Tiêu chí SV5T (A1 - E15)
  sv5tCriteriaText: string;
  hoiProgramId: string; // 13. Mảng CT Hội (1 - 9)
  hoiProgramText: string;
  doanProgramId: string; // 14. Mảng CT Đoàn (KR1.1 - KR8.2)
  doanProgramText: string;
  dataCommitment: boolean; // 15. Cam kết dữ liệu
  status: ActivityStatus;
  feedbackNotes?: string;
  approvedByL3?: string;
  approvedByL4?: string;
  approvedDate?: string;
  createdAt: string;
  driveFileId?: string;
  participants: ActivityParticipantEntry[];

  // Yêu cầu 4: Bổ sung minh chứng tổ chức & Thông báo email tự động hạn 1 tuần
  proofImages?: string[]; // Danh sách URL hình ảnh hoạt động
  attendanceSheetUrl?: string; // Link/File danh sách điểm danh ký tên
  actualPlanUrl?: string; // Link văn bản kế hoạch thực tế
  deadlineReminderSentDate?: string; // Ngày đã gửi email nhắc nhở nộp danh sách
  isRosterSubmitted?: boolean; // Đã hoàn thiện danh sách chính thức hay chưa

  // Yêu cầu 3: Khóa dữ liệu hoạt động
  isLocked?: boolean;

  // Thanh công cụ lọc dữ liệu: Học kỳ, Năm học & Loại hình Đoàn/Hội
  semester?: SemesterOption;
  activityType?: ActivityTypeOption;

  // Quyền tác giả và tài khoản khởi tạo hoạt động
  createdBy?: string;
  createdEmail?: string;
  createdRole?: string;

  // Chuẩn hóa phiên bản, thời gian & Xóa mềm
  version?: number;
  updatedAt?: string;
  updatedBy?: string;
  deleted?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletedReason?: string;
}

// Ràng buộc số lượng nhân sự Ban tổ chức và Cộng tác viên theo Cấp chương trình
export interface ProgramPersonnelQuota {
  level: number; // 1 | 2 | 3 | 4
  levelName: string; // "Chương trình Cấp 1", "Chương trình Cấp 2", etc.
  description?: string;
  maxBtc: number; // Số lượng tối đa Ban tổ chức
  maxCtv: number; // Số lượng tối đa Cộng tác viên
}

export interface Sv5tStandardGroup {
  id: string;
  name: string;
  criteria: { id: string; code: string; title: string; required: boolean }[];
}

export type SemesterOption = 'HK1' | 'HK2' | 'HK_HE';
export type ActivityTypeOption = 'DOAN' | 'HOI' | 'DOAN_HOI';
export type FilterSemester = 'ALL' | SemesterOption;
export type FilterActivityType = 'ALL' | ActivityTypeOption;
export type FilterAcademicYear = 'ALL' | string;

export interface CommonDataFilters {
  academicYear: string;
  semester: FilterSemester;
  activityType: FilterActivityType;
  searchTerm?: string;
}

export type StudentMembership = 'DOAN_VIEN' | 'HOI_VIEN' | 'SINH_VIEN';

export interface StudentScoreRecord {
  id: string;
  studentId: string; // MSSV duy nhất
  fullName: string;
  classCode: string;
  facultyCode: string;
  clubCodes?: string[]; // CLB/Tổ/Đội nhóm trực thuộc theo danh mục
  clubCode?: string; // Mã CLB/Tổ/Đội/Nhóm chính theo danh mục (Lookup từ Organization)
  clubName?: string; // Tên hiển thị CLB/Tổ/Đội/Nhóm theo danh mục
  clubCategory?: ClubCategory; // Phân loại danh mục: 'CLB' | 'TO' | 'DOI' | 'NHOM' (Câu Lạc Bộ, Tổ, Đội, Nhóm)
  membershipType: StudentMembership; // Đoàn viên / Hội viên / Sinh viên
  academicYearNumber: number; // 1 (Khóa mới) or 2+ (Năm 2 trở đi)
  bonusScore: number; // Điểm Khen thưởng
  positionScore: number; // Điểm Chức vụ
  researchScore: number; // Điểm NCKH
  activityScore: number; // Tổng điểm hoạt động đã tham gia
  totalScore: number; // Tổng = bonus + position + research + activity
  rankGrade: 'Hoàn thành xuất sắc nhiệm vụ' | 'Hoàn thành tốt nhiệm vụ' | 'Hoàn thành nhiệm vụ' | 'Không hoàn thành nhiệm vụ';
  rankGeneral: 'Xuất sắc' | 'Tốt' | 'Khá' | 'Trung bình' | 'Yếu'; // Xếp loại thi đua rèn luyện chung 5 mức
  isSv5tEligible: boolean; // Đạt đủ 100% cả 5 tiêu chuẩn
  sv5tCriteriaAchieved: Record<string, boolean>; // id criteria -> true/false
  approvedActivitiesCount: number;
  email?: string;
  userId?: string;
  uid?: string;

  // Chuẩn hóa phiên bản, thời gian & Xóa mềm
  version?: number;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  deleted?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletedReason?: string;
}

export type SyncStatusState = 'synced' | 'syncing' | 'offline' | 'conflict' | 'error';
export interface SyncStatusInfo {
  state: SyncStatusState;
  lastSyncedAt?: string;
  pendingCount: number;
  errorMessage?: string;
}

export type SelfProofCategoryType = 'KHEN_THUONG' | 'CHUC_VU' | 'NCKH' | 'DANG_VIEN_HUONG_DAN' | 'KHAC';

export interface ScoringCatalogItem {
  id: string;
  code: string;
  title: string;
  points: number;
  category: SelfProofCategoryType;
  description?: string;
  level?: string;
  maxCapNote?: string;
  active: boolean;
}

export interface StudentSelfProof {
  id: string;
  studentId: string;
  type: SelfProofCategoryType;
  catalogItemId?: string;
  title: string;
  description: string;
  scoreClaimed: number;
  driveProofUrl: string;
  driveFileId?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedScore?: number;
  submissionDate: string;
  reviewDate?: string;
  reviewNotes?: string;
  isHighestCounted?: boolean;
}

export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  size?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
}

// Module 6: Giấy chứng nhận điện tử & Mẫu Template
export interface CertificateTemplate {
  id: string;
  title: string; // "GIẤY CHỨNG NHẬN", "BẰNG KHEN", "CHỨNG NHẬN THAM GIA"
  subTitle: string; // "BAN CHẤP HÀNH ĐOÀN TRƯỜNG ĐẠI HỌC NÔNG LÂM TP. HỒ CHÍ MINH"
  introText: string; // "Chứng nhận Đồng chí:"
  contentTemplate: string; // "Đã hoàn thành xuất sắc và đóng góp tích cực vào chương trình..."
  signatoryTitle: string; // "TM. BAN THƯỜNG VỤ ĐOÀN TRƯỜNG\nBÍ THƯ"
  signatoryName: string; // "ThS. Lê Hoàng Tuấn"
  logoUrl?: string;
  secondaryLogoUrl?: string;
  signatureImageUrl?: string;
  stampImageUrl?: string;
  themeColor: 'gold' | 'emerald' | 'navy' | 'crimson';
  fontStyle: 'classic' | 'modern' | 'formal';
  borderStyle: 'double' | 'ornate' | 'modern';
  showQrCode: boolean;
  academicYear: string;
}

export interface IssuedCertificate {
  id: string;
  code: string; // Vd: GCN-2026-A001-22130001
  activityId: string;
  activityTitle: string;
  studentId: string;
  studentName: string;
  classCode: string;
  facultyCode: string;
  role: ParticipantRoleType;
  issueDate: string;
  qrCodeUrl: string;
  driveUrl?: string;
}

// Attendance Record captured in Firebase for student activity check-in
export interface AttendanceRecord {
  id: string; // Unique ID, typically `${activityId}_${studentId}`
  activityId: string;
  activityTitle: string;
  studentId: string;
  studentName: string;
  classCode: string;
  facultyCode: string;
  role?: ParticipantRoleType;
  checkInTimestamp: string; // ISO 8601 string
  sessionToken: string; // Unique session verification token
  status: 'Confirmed' | 'Attended' | 'Pending';
  scoreAwarded: number;
  recordedBy: string; // e.g. "student_portal" | "officer_scan" | "qr_checkin"
  deviceInfo?: string;
  createdAt: string;
  updatedAt?: string;
  createdAtServer?: any;
}

// ============================================================================
// DANH MỤC CHỈ TIÊU - QUẢN LÝ & ĐÁNH GIÁ THÔNG MINH (KPI TARGETS & AI FORECAST)
// ============================================================================

export type TargetOrgType = 'DOAN' | 'HOI'; // Tab Đoàn Thanh niên hoặc Tab Hội Sinh viên

export type TargetCategory =
  | 'HOC_THUAT'          // Học thuật, NCKH & Đổi mới sáng tạo
  | 'TRACH_NHIEM_XA_HOI' // Trách nhiệm xã hội & Hoạt động tình nguyện
  | 'THE_LUC'            // Thể lực & Thể dục thể thao
  | 'KY_NANG'            // Kỹ năng thực hành xã hội & Hội nhập quốc tế
  | 'TO_CHUC_DOAN_HOI';  // Xây dựng Tổ chức Đoàn Thanh niên - Hội Sinh viên

export type TargetMetricType = 'NUMBER' | 'PERCENTAGE';
export type TargetLevel = 'TRUONG' | 'KHOA' | 'CHI_DOAN_CLB';
export type TargetAiForecastStatus = 'DAT' | 'BAO_DONG' | 'NGUY_CO';
export type TargetRegistrationStatus = 'CHUA_DANG_KY' | 'CHO_DUYET' | 'DA_DUYET' | 'TU_CHOI';

export const TARGET_CATEGORY_LABELS: Record<TargetCategory, string> = {
  HOC_THUAT: 'Học thuật & NCKH',
  TRACH_NHIEM_XA_HOI: 'Trách nhiệm Xã hội',
  THE_LUC: 'Thể lực & Rèn luyện',
  KY_NANG: 'Kỹ năng & Hội nhập',
  TO_CHUC_DOAN_HOI: 'Tổ chức Đoàn - Hội'
};

export interface TargetSubAllocation {
  id: string;
  unitCode: string; // Mã đơn vị: Mã Khoa (CNTT), Chi đoàn (DH22IT01), CLB (CLB_KN)
  unitName: string;
  unitType: 'KHOA' | 'CHI_DOAN' | 'CLB';
  assignedValue: number; // Mức chỉ tiêu phân bổ chính thức được cấp trên phê duyệt/áp đặt
  currentValue: number; // Tiến độ đạt được thực tế
  completionRate: number; // Tỷ lệ hoàn thành %
  forecastStatus: TargetAiForecastStatus;
  
  // Mô hình phân cấp: Cấp dưới đăng ký với cấp trên & Cấp trường quyết định cuối cùng
  targetQuota?: number; // Định mức khung do Cấp 4 / cấp trên dự kiến ban đầu
  registeredValue?: number; // Mức chỉ tiêu đơn vị cấp dưới chủ động lập hồ sơ đăng ký
  registrationStatus?: TargetRegistrationStatus; // 'CHUA_DANG_KY' | 'CHO_DUYET' | 'DA_DUYET' | 'TU_CHOI'
  isAutoAllocatedBySchool?: boolean; // True nếu cấp khoa không đăng ký và cấp Trường tự động phân bổ áp đặt
  registeredBy?: string; // Người đại diện đơn vị gửi đăng ký
  registeredAt?: string; // Thời gian gửi đăng ký
  decidedBy?: string; // Cán bộ Cấp 4 duyệt hoặc tự động phân bổ
  decidedAt?: string; // Thời gian phê chuẩn / phân bổ chính thức
  decisionNote?: string; // Ý kiến chỉ đạo / Quyết định giao chỉ tiêu của Cấp trường
  actionPlan?: string; // Kế hoạch triển khai & giải pháp của đơn vị
  notes?: string;
  updatedAt?: string;
}

export interface TargetEvidenceCheck {
  id: string;
  activityId: string;
  activityTitle: string;
  checkedAt: string;
  participantCountVerified: number;
  qrVerifiedCount: number;
  aiVerificationConfidence: number; // Tỷ lệ tin cậy AI (Vd: 98%)
  status: 'VERIFIED' | 'FLAGGED' | 'MANUAL_OVERRIDE';
  notes: string;
}

export interface TargetItem {
  id: string; // Vd: "CT-2026-01"
  code: string; // Mã chỉ tiêu (Vd: "CT01", "CT-HT-01")
  name: string; // Tên chỉ tiêu
  description: string;
  
  // Phân loại 2 Tab chính: Đoàn Thanh niên vs Hội Sinh viên
  orgType: TargetOrgType; // 'DOAN' (Đoàn Thanh niên) | 'HOI' (Hội Sinh viên)
  
  // Mảng công tác:
  // Đoàn: Lấy từ 14. Mảng CT Đoàn & Phong trào TT (C.14) (KR1.1 -> KR8.2)
  // Hội: Lấy từ 13. Mảng CT Hội & Phong trào SV (C.13) (1 -> 9)
  programId: string; // Mã mảng CT: 'KR2.2', '3', etc.
  programText: string; // Tên hiển thị mảng CT
  
  category: TargetCategory; // Phân loại mảng công tác bổ trợ
  metricType: TargetMetricType; // Số lượng hoặc Tỷ lệ %
  unitOfMeasure: string; // Đơn vị tính: "Sinh viên", "Chi đoàn", "%", "Khóa huấn luyện", "Đoàn viên"
  targetValue: number; // Mức chỉ tiêu giao toàn trường
  currentValue: number; // Tiến độ thực tế đạt được
  completionRate: number; // % hoàn thành (real-time)
  academicYear: string; // Năm học: "2026-2027"
  semester?: 'ALL' | 'HK1' | 'HK2';
  level: TargetLevel; // Cấp giao chỉ tiêu: TRUONG, KHOA, CHI_DOAN_CLB
  priorityWeight: number; // Trọng số ưu tiên (1 - 5 sao)
  isLocked: boolean; // Khóa chỉ tiêu (không cho sửa mức giao)
  lockedReason?: string;
  lockedBy?: string;
  lockedAt?: string;
  registrationDeadline?: string; // Hạn chót để cấp khoa/CLB đăng ký chỉ tiêu

  // Phân bổ & Liên kết
  linkedActivityIds: string[]; // Danh sách mã hoạt động gắn với chỉ tiêu
  linkedActivityCount: number;
  allocations: TargetSubAllocation[]; // Danh sách đơn vị con đã phân bổ / đăng ký
  allocatedUnitsCount: number; // Số đơn vị đã thiết lập
  unregisteredUnitsCount?: number; // Số đơn vị chưa đăng ký

  // Tiến độ & Trạng thái AI
  aiForecastStatus: TargetAiForecastStatus; // Đạt | Báo động | Nguy cơ thiếu hụt
  aiForecastProbability: number; // Xác suất hoàn thành % (0 - 100)
  aiForecastAnalysis: string; // Đánh giá phân tích AI
  aiSuggestedActions: string[]; // Gợi ý AI các hoạt động cần tổ chức bổ sung
  evidenceChecks?: TargetEvidenceCheck[]; // Nhật ký đối soát minh chứng AI

  // RBAC & Quản trị
  createdBy: {
    userId: string;
    userName: string;
    userEmail: string;
    roleLevel: number;
  };
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

// Custom Navigation Menu Configuration (Chỉnh sửa menu thủ công Cấp 4)
export interface CustomNavItem {
  id: string;
  label: string;
  description?: string;
  iconName?: string;
  visible: boolean;
  minLevel: number; // 0: Guest, 1: Student, 2: Class, 3: Faculty, 4: School
  isCustomLink?: boolean;
  externalUrl?: string;
  order: number;
}

// Custom Footer Configuration (Chỉnh sửa footer Cấp 4)
export interface FooterCustomLink {
  label: string;
  url: string;
}

export interface FooterConfig {
  orgName: string;
  unitName: string;
  systemTitle: string;
  contactEmail: string;
  hotline?: string;
  address?: string;
  websiteUrl?: string;
  copyrightText: string;
  customLinks?: FooterCustomLink[];
}

// Custom Header Logo & Branding Configuration (Cấp 4)
export interface HeaderBranding {
  logoUrl?: string;
  secondaryLogoUrl?: string;
  badgeText: string;
  titleText: string;
  subtitleText: string;
}

// System Dictionary & Terminology Management (Danh mục từ, cụm từ hệ thống Cấp 4)
export type SystemTermCategory =
  | 'TITLES_DESCRIPTIONS'
  | 'SYSTEM_NOTICES'
  | 'SECTION_LABELS'
  | 'CERTIFICATES_REPORTS'
  | 'ORGANIZATION'
  | 'SCORE_EMULATION'
  | 'ACTIVITIES'
  | 'SYSTEM_ROLES'
  | 'GENERAL';

export interface SystemTermItem {
  id: string;
  key: string;              // Unique key identifier e.g. "term_doan_vien"
  originalText: string;     // Default text e.g. "Đoàn viên"
  customText: string;       // Customized replacement text e.g. "Đoàn viên TNCS"
  category: SystemTermCategory;
  description?: string;     // Contextual usage notes
  isCustomEntry?: boolean;  // True if manually added by Level 4 admin
  updatedAt?: string;
  updatedBy?: string;
}

// Module 1: Backup hệ thống
export interface BackupRecord {
  id: string;
  timestamp: string;
  fileName: string;
  fileSizeKb: number;
  driveFileId?: string;
  driveUrl?: string;
  stats: {
    students: number;
    activities: number;
    accounts: number;
    certificates: number;
  };
}

// Notification System
export type NotificationType = 'deadline' | 'activity' | 'proof' | 'overdue' | 'system';
export type NotificationPriority = 'urgent' | 'warning' | 'info';

export interface SystemNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  priority: NotificationPriority;
  targetTab?: string;
  targetId?: string;
  actionText?: string;
  isRead?: boolean;
}

// Push Toast Notifications
export type ToastCategory = 'activity' | 'score' | 'proof' | 'certificate' | 'system';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title?: string;
  category?: ToastCategory;
  actionLabel?: string;
  onAction?: () => void;
  createdAt: number;
  durationMs?: number;
}

// Student Push Notification Record
export interface StudentPushNotification {
  id: string;
  studentId: string;
  studentName?: string;
  type: 'activity_approved' | 'score_updated' | 'proof_approved' | 'system';
  title: string;
  message: string;
  scoreDiff?: number;
  activityId?: string;
  activityTitle?: string;
  createdAt: string;
  isRead: boolean;
  linkTab?: string;
}

// Score Audit Log (Lịch sử thay đổi điểm rèn luyện & vết kiểm toán minh bạch)
export type ScoreAuditActionType =
  | 'INLINE_EDIT'       // Chỉnh sửa trực tiếp trên bảng
  | 'MODAL_EDIT'        // Chỉnh sửa qua phiếu cập nhật chi tiết
  | 'BATCH_BONUS'       // Cộng điểm thưởng hàng loạt
  | 'BATCH_MEMBERSHIP'  // Đổi phân loại đối tượng hàng loạt
  | 'BATCH_RECALCULATE' // Chuẩn hóa tính lại xếp loại
  | 'PROOF_APPROVAL'    // Thẩm định duyệt minh chứng cá nhân
  | 'EXCEL_IMPORT'      // Nạp điểm từ file Excel danh sách hoạt động
  | 'RESET_SCORE'       // Khôi phục hoặc điều chỉnh ngoại lệ
  | 'QR_CHECKIN';       // Điểm danh hoạt động qua QR Code

export interface ScoreSnapshot {
  bonusScore: number;
  positionScore: number;
  researchScore: number;
  activityScore: number;
  totalScore: number;
  rankGrade?: string;
  rankGeneral?: string;
}

export interface ScoreAuditLog {
  id: string;
  timestamp: string; // e.g. "2026-10-06 11:35:10"
  studentId: string; // MSSV hoặc 'BATCH_MULTIPLE'
  studentName: string; // Họ tên SV hoặc '15 sinh viên (DH22IT01...)'
  classCode?: string;
  facultyCode?: string;
  actionType: ScoreAuditActionType;
  actionTitle: string; // e.g. "Điều chỉnh điểm khen thưởng cá nhân"
  performedBy: {
    userId: string;
    userName: string;
    userEmail: string;
    roleName: string;
    roleLevel: number; // 1: SV/Cá nhân, 2: Chi đoàn, 3: Khoa, 4: Trường
    orgCode?: string;
  };
  previousScores: ScoreSnapshot;
  newScores: ScoreSnapshot;
  scoreDifference: number; // e.g. +7 or -5 or 0
  reason?: string; // Căn cứ quyết định / Ghi chú minh bạch
  affectedStudentCount?: number;
  ipAddress?: string;
}

export type ActivityLogCategory =
  | 'ACCOUNT_PERMISSION'  // Phân quyền & Cấp quyền Google SSO
  | 'ACTIVITY_WORKFLOW'   // Phê duyệt & Quản lý hoạt động
  | 'SCORE_MANAGEMENT'    // Điểm rèn luyện & Minh chứng SV5T
  | 'SYSTEM_SECURITY'     // Quản trị hệ thống, sao lưu & khóa
  | 'ORGANIZATION_DATA';  // Quản lý đơn vị & Chi đoàn

export type ActivityLogSeverity = 'info' | 'success' | 'warning' | 'danger';

export interface SystemActivityLog {
  id: string;
  timestamp: string; // e.g. "2026-10-06 14:30:25"
  category: ActivityLogCategory;
  actionTitle: string; // e.g. "Cấp quyền tài khoản Google SSO"
  actionDetail: string; // e.g. "Cấp quyền Cấp 3 (Đoàn Khoa CNTT) cho email doankhoacntt@hcmuaf.edu.vn"
  severity: ActivityLogSeverity;
  performedBy: {
    userId: string;
    userName: string;
    userEmail: string;
    roleName: string;
    roleLevel: number;
    avatarUrl?: string;
  };
  targetEntity?: {
    type: 'ACCOUNT' | 'ACTIVITY' | 'STUDENT' | 'ORGANIZATION' | 'BACKUP' | 'CERTIFICATE';
    id: string;
    name: string;
  };
  changes?: {
    field: string;
    oldValue?: string;
    newValue?: string;
  }[];
  ipAddress?: string;
}

// Student Data Audit Log (Nhật ký kiểm toán chi tiết lưu vết trước và sau khi thay đổi dữ liệu Đoàn viên / Sinh viên)
export interface AuditTrailPerformedBy {
  userId: string;
  userName: string;
  userEmail: string;
  roleName: string;
  roleLevel: number;
  orgCode?: string;
}

export interface StudentAuditLog {
  id: string;
  timestamp: string; // ISO string hooc dinh dang "YYYY-MM-DD HH:mm:ss"
  studentId: string;
  studentName: string;
  classCode?: string;
  facultyCode?: string;
  actionType: 'UPDATE_STUDENT' | 'BATCH_UPDATE' | 'DELETE_STUDENT' | 'RESTORE_STUDENT' | 'IMPORT_STUDENT' | 'INLINE_EDIT' | 'MODAL_EDIT' | string;
  actionTitle: string;
  performedBy: AuditTrailPerformedBy;
  beforeState: Partial<StudentScoreRecord> | null;
  afterState: Partial<StudentScoreRecord> | null;
  previousData?: Partial<StudentScoreRecord> | null; // Alias
  newData?: Partial<StudentScoreRecord> | null;      // Alias
  changedFields?: string[]; // Cach truong du lieu bi thay doi
  reason?: string;
  ipAddress?: string;
}


