import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  UserProfile,
  AttendanceRecord,
  UserRole,
  SystemUserAccount,
  ActivitySubmission,
  StudentScoreRecord,
  StudentSelfProof,
  Organization,
  BranchClass,
  ActivityParticipantEntry,
  ParticipantRoleType,
  StudentMembership,
  CertificateTemplate,
  IssuedCertificate,
  BackupRecord,
  ToastItem,
  ToastCategory,
  ScoreAuditLog,
  StudentAuditLog,
  ScoreSnapshot,
  StudentPushNotification,
  SystemActivityLog,
  CustomNavItem,
  RoleLevel,
  FooterConfig,
  HeaderBranding,
  ClubCategory,
  getClubCategory,
  TargetItem,
  TargetSubAllocation,
  TargetCategory,
  TargetAiForecastStatus,
  ScoringCatalogItem,
  ProgramPersonnelQuota
} from '../types';
import { safeLocalStorageSetItem, debouncedSafeLocalStorageSetItem } from '../utils/safeStorage';
import {
  INITIAL_ANNUAL_AWARDS_CATALOG,
  INITIAL_RESEARCH_AWARDS_CATALOG,
  INITIAL_POSITION_ROLES_CATALOG,
  INITIAL_PARTY_MENTOR_CATALOG
} from '../data/proofCatalogsData';
import { INITIAL_TARGETS, calculateTargetAiForecast } from '../data/initialTargets';
import {
  ORGANIZATIONS_LIST,
  BRANCH_CLASSES,
  calculateRankGrade,
  calculateGeneralRank,
  calculateProgramLevelScore,
  getPointsForRole,
  checkSv5tEligibility,
  computeAutoSv5t,
  computeAllStudentsAutoSv5t,
  generateActivityCode,
  CURRENT_ACADEMIC_YEAR,
  DEFAULT_CERTIFICATE_TEMPLATE,
  DRL_CRITERIA,
  SV5T_STANDARDS,
  HOI_PROGRAMS,
  DOAN_PROGRAMS,
  ROLE_POINTS_MATRIX,
  Sv5tStandardGroup,
  TARGET_SCALE_CONFIG,
  DEFAULT_PROGRAM_PERSONNEL_QUOTAS
} from '../data/mockData';
import {
  INITIAL_USER,
  INITIAL_SYSTEM_ACCOUNTS,
  INITIAL_STUDENTS,
  INITIAL_ACTIVITIES,
  INITIAL_SELF_PROOFS,
  INITIAL_CERTIFICATE_TEMPLATE,
  INITIAL_ISSUED_CERTIFICATES,
  INITIAL_BACKUPS,
  INITIAL_SCORE_AUDIT_LOGS,
  INITIAL_PUSH_NOTIFICATIONS,
  INITIAL_SYSTEM_ACTIVITY_LOGS
} from '../data/initialData';
import { googleSignIn, logout as firebaseLogout, initAuth, auth } from '../services/firebase';
import { backupDatabaseToDrive } from '../services/driveService';
import {
  testFirestoreConnection,
  subscribeActivities,
  subscribeStudents,
  subscribeActivityLogs,
  saveActivityToFirestore,
  batchSaveActivitiesToFirestore,
  deleteActivityFromFirestore,
  batchDeleteActivitiesFromFirestore,
  softDeleteActivityInFirestore,
  restoreActivityInFirestore,
  saveStudentToFirestore,
  batchSaveStudentsToFirestore,
  deleteStudentFromFirestore,
  batchDeleteStudentsFromFirestore,
  softDeleteStudentInFirestore,
  restoreStudentInFirestore,
  saveActivityLogToFirestore,
  hardDeleteActivityFromFirestore,
  hardDeleteStudentFromFirestore,
  fetchSystemAccountByEmail,
  fetchStudentByEmail,
  fetchStudentByUid,
  captureAttendanceRecordInFirestore,
  getAttendanceRecordsFromFirestore,
  performCheckInTransaction,
  subscribeScoreAuditLogs,
  saveScoreAuditLogToFirestore,
  subscribeStudentAuditLogs,
  saveStudentAuditLogToFirestore,
  batchSaveStudentAuditLogsToFirestore,
  computeStudentChangedFields,
  subscribeIssuedCertificates,
  saveIssuedCertificateToFirestore,
  deleteIssuedCertificateFromFirestore,
  batchSaveIssuedCertificatesToFirestore,
  subscribeNavigationMenu,
  saveNavigationMenuToFirestore,
  subscribeFooterConfig,
  saveFooterConfigToFirestore,
  subscribeHeaderBranding,
  saveHeaderBrandingToFirestore,
  subscribeSystemDictionary,
  saveSystemDictionaryToFirestore,
  seedInitialFirestoreDataIfEmpty,
  subscribeSystemAccounts,
  saveSystemAccountToFirestore,
  deleteSystemAccountFromFirestore,
  batchSaveSystemAccountsToFirestore,
  ensureAdminAccountExists,
  subscribeTargets,
  saveTargetToFirestore,
  deleteTargetFromFirestore,
  batchSaveTargetsToFirestore
} from '../services/firestoreService';
import { firestoreRetryQueue } from '../services/firestoreRetryQueue';
import { logFirestoreWriteDiagnostic } from '../utils/firestoreDiagnosticLogger';
import {
  validateStudentData,
  validateActivityData,
  validateOrganizationCode,
  validateClassCode,
  reconstructStudentTotalsFromSource,
  validateActivityContributionsAgainstStudents,
  ActivityContributionValidationReport,
  isSchoolYouthUnionOrAssociation,
  validateStudentCollectionIntegrity,
  StudentCollectionIntegrityReport,
  StudentIntegrityIssue
} from '../utils/dataIntegrity';
import { SystemTermItem, SyncStatusInfo } from '../types';
import { DEFAULT_SYSTEM_TERMS } from '../data/initialDictionary';
import { CANONICAL_NAVIGATION_CONFIG } from '../config/navigationConfig';
import { User } from 'firebase/auth';

interface AppContextType {
  user: UserProfile;
  switchRole: (roleId: string) => void;
  googleUser: User | null;
  accessToken: string | null;
  isConnectingGoogle: boolean;
  loginGoogle: () => Promise<void>;
  logoutGoogle: () => Promise<void>;

  // Sync Status & Network
  syncStatus: SyncStatusInfo;
  isInitialLoading: boolean;

  // Theme (Dark Mode / Light Mode)
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  
  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Academic Year
  academicYear: string;

  // Activities (Workflow, Lock, Edit, Excel)
  activities: ActivitySubmission[];
  allActivities: ActivitySubmission[];
  deletedActivities: ActivitySubmission[];
  addActivity: (actData: Omit<ActivitySubmission, 'id' | 'createdAt' | 'status' | 'participants'>) => boolean;
  updateActivity: (id: string, updates: Partial<ActivitySubmission>) => void;
  updateActivityProof: (
    activityId: string,
    proofData: { proofImages?: string[]; attendanceSheetUrl?: string; actualPlanUrl?: string; proofArticleUrl?: string }
  ) => void;
  sendActivityRosterReminder: (activityId: string) => void;
  toggleLockActivity: (id: string) => void;
  reviewActivity: (id: string, decision: 'approve' | 'reject' | 'request_edit', feedbackNotes?: string) => void;
  deleteActivity: (id: string, reason?: string) => boolean;
  deleteBatchActivities: (ids: string[], reason?: string) => boolean;
  restoreActivity: (id: string) => Promise<boolean>;
  permanentDeleteActivity: (id: string) => Promise<boolean>;
  uploadActivityParticipants: (
    activityId: string,
    participants: { studentId: string; fullName: string; role: ParticipantRoleType; classCode?: string }[]
  ) => { successCount: number; newParticipantCount: number };
  bulkImportActivities: (
    importedList: Omit<ActivitySubmission, 'id' | 'createdAt' | 'status' | 'participants'>[],
    autoApprove?: boolean
  ) => { successCount: number; errorCount: number; importedIds: string[] };

  // Students & Scores (Directory, Inline editing & Batch update)
  students: StudentScoreRecord[];
  allStudents: StudentScoreRecord[];
  deletedStudents: StudentScoreRecord[];
  addStudent: (student: {
    studentId: string;
    fullName: string;
    classCode: string;
    facultyCode: string;
    clubCodes?: string[];
    clubCode?: string;
    clubName?: string;
    clubCategory?: ClubCategory;
    membershipType: StudentMembership;
    academicYearNumber: number;
    activityScore?: number;
    bonusScore?: number;
    positionScore?: number;
    researchScore?: number;
  }) => boolean;
  updateStudent: (studentId: string, updates: Partial<StudentScoreRecord>, reason?: string) => void;
  deleteStudent: (studentId: string, reason?: string) => void;
  deleteBatchStudents: (studentIds: string[], reason?: string) => void;
  restoreStudent: (studentId: string) => Promise<boolean>;
  permanentDeleteStudent: (studentId: string) => Promise<boolean>;
  batchUpdateStudents: (
    studentIds: string[],
    action: { bonusAdd?: number; membershipType?: StudentMembership; academicYearNumber?: number; recalculate?: boolean; clubCode?: string; clubCodes?: string[] }
  ) => void;
  validateActivityContributions: () => ActivityContributionValidationReport;
  bulkImportStudents: (
    importedStudents: {
      studentId: string;
      fullName: string;
      classCode: string;
      facultyCode: string;
      clubCodes?: string[];
      membershipType?: StudentMembership;
      academicYearNumber?: number;
    }[],
    updateExisting?: boolean
  ) => { successCount: number; duplicateCount: number; errorCount: number };
  restoreSampleStudents: () => void;
  restoreSampleActivities: () => void;
  // Student Collection Integrity & Backup Restore
  checkStudentCollectionIntegrity: () => StudentCollectionIntegrityReport;
  restoreStudentsFromLatestBackup: (targetSnapshotId?: string) => Promise<{ success: boolean; restoredCount: number; message: string }>;
  latestStudentBackupInfo: { id: string; timestamp: string; count: number; source: string } | null;
  createStudentBackupSnapshot: (source?: string) => void;
  autoFixUncatalogedClasses: () => { registeredCount: number; fixedStudentCount: number; message: string };
  checkInActivity: (params: {
    activityId: string;
    studentId: string;
    role?: ParticipantRoleType;
    sessionId?: string;
    token?: string;
    operationId?: string;
    recordedByEmail?: string;
  }) => Promise<{ success: boolean; message: string; record?: AttendanceRecord; isDuplicate?: boolean }>;
  selectedPortalStudentId: string | null;
  setSelectedPortalStudentId: (id: string | null) => void;

  // Self Proofs
  selfProofs: StudentSelfProof[];
  addSelfProof: (proof: Omit<StudentSelfProof, 'id' | 'status' | 'submissionDate'>) => void;
  reviewSelfProof: (id: string, decision: 'approve' | 'reject', approvedScore?: number, notes?: string) => void;
  toggleSv5tCriterion: (studentId: string, criterionId: string) => void;

  // User Accounts Management (Cấp Trường)
  accounts: SystemUserAccount[];
  addAccount: (acc: Omit<SystemUserAccount, 'id' | 'createdAt'>) => void;
  batchAddAccounts: (accs: Omit<SystemUserAccount, 'id' | 'createdAt'>[]) => number;
  updateAccount: (id: string, updates: Partial<SystemUserAccount>) => void;
  deleteAccount: (id: string) => void;
  toggleAccountStatus: (id: string) => void;

  // Organizations & Classes
  organizations: Organization[];
  addOrganization: (org: Organization) => void;
  batchAddOrganizations: (orgs: Organization[]) => number;
  updateOrganization: (code: string, updates: Partial<Organization>) => void;
  deleteOrganization: (code: string) => void;
  batchDeleteOrganizations: (codes: string[]) => number;
  branchClasses: BranchClass[];
  addBranchClass: (cls: Omit<BranchClass, 'id'>) => void;
  batchAddBranchClasses: (classes: Omit<BranchClass, 'id'>[]) => number;
  updateBranchClass: (code: string, updates: Partial<BranchClass>) => void;
  deleteBranchClass: (code: string) => void;
  batchDeleteBranchClasses: (codes: string[]) => number;

  // Module 6: Certificates & Template
  certificateTemplate: CertificateTemplate;
  updateCertificateTemplate: (updates: Partial<CertificateTemplate>) => void;
  issuedCertificates: IssuedCertificate[];
  issueCertificate: (activityId: string, studentId: string, role: ParticipantRoleType) => void;
  issueBatchCertificates: (activityId: string) => number;
  updateIssuedCertificate: (certId: string, updates: Partial<IssuedCertificate>) => void;
  deleteIssuedCertificate: (certId: string) => void;

  // Module 1: Backup hệ thống
  backups: BackupRecord[];
  createSystemBackup: () => Promise<void>;

  // Module Chỉ Tiêu - Quản Lý & Đánh Giá Thông Minh (KPIs & AI Forecast)
  targets: TargetItem[];
  addTarget: (target: Omit<TargetItem, 'createdAt' | 'updatedAt'>) => void;
  updateTarget: (id: string, updates: Partial<TargetItem>) => void;
  deleteTarget: (id: string) => void;
  toggleLockTarget: (id: string, reason?: string) => void;
  allocateSubTarget: (targetId: string, allocation: TargetSubAllocation) => void;
  batchImportTargets: (importedTargets: TargetItem[]) => number;
  restoreSampleTargets: () => void;
  autoAllocateUnregisteredUnits: (targetId: string, defaultQuota?: number) => void;
  approveUnitRegistration: (targetId: string, unitCode: string, approvedValue: number, note?: string) => void;
  rejectUnitRegistration: (targetId: string, unitCode: string, reason?: string) => void;
  submitUnitRegistration: (targetId: string, allocationData: Partial<TargetSubAllocation>) => void;
  syncTargetActivitiesFromPrograms: () => void;
  
  // Dynamic Scoring & Lookups Catalogs
  drlCriteria: Array<{ id: string; title: string }>;
  updateDrlCriteria: (next: Array<{ id: string; title: string }>) => void;
  resetDrlCriteria: () => void;
  sv5tStandards: Array<Sv5tStandardGroup>;
  updateSv5tStandards: (next: Array<Sv5tStandardGroup>) => void;
  resetSv5tStandards: () => void;
  targetScaleConfig: Array<{ id: number; name: string; points: number }>;
  updateTargetScaleConfig: (next: Array<{ id: number; name: string; points: number }>) => void;
  resetTargetScaleConfig: () => void;
  rolePointsMatrix: Record<string, { c1: number; c2: number; c3: number; c4: number }>;
  updateRolePointsMatrix: (next: Record<string, { c1: number; c2: number; c3: number; c4: number }>) => void;
  doanPrograms: Array<{ id: string; title: string }>;
  updateDoanPrograms: (next: Array<{ id: string; title: string }>) => void;
  resetDoanPrograms: () => void;
  hoiPrograms: Array<{ id: string; title: string }>;
  updateHoiPrograms: (next: Array<{ id: string; title: string }>) => void;
  resetHoiPrograms: () => void;
  updateOrganizations: (next: Organization[]) => void;
  setOrganizations: React.Dispatch<React.SetStateAction<Organization[]>>;

  // Level 4 Proof Scoring Catalogs (Khen thưởng, NCKH, Chức vụ, Đảng viên hướng dẫn)
  annualAwardsCatalog: ScoringCatalogItem[];
  updateAnnualAwardsCatalog: (next: ScoringCatalogItem[]) => void;
  researchAwardsCatalog: ScoringCatalogItem[];
  updateResearchAwardsCatalog: (next: ScoringCatalogItem[]) => void;
  positionRolesCatalog: ScoringCatalogItem[];
  updatePositionRolesCatalog: (next: ScoringCatalogItem[]) => void;
  partyMentorCatalog: ScoringCatalogItem[];
  updatePartyMentorCatalog: (next: ScoringCatalogItem[]) => void;
  resetProofCatalogs: () => void;

  // Cấu hình ràng buộc số lượng BTC & CTV theo Cấp chương trình (Cấp 1 - 4)
  programPersonnelQuotas: ProgramPersonnelQuota[];
  updateProgramPersonnelQuotas: (next: ProgramPersonnelQuota[]) => void;
  resetProgramPersonnelQuotas: () => void;

  // Score Audit Log (Lịch sử thay đổi điểm rèn luyện & vết kiểm toán minh bạch)
  scoreAuditLogs: ScoreAuditLog[];
  addScoreAuditLog: (logData: Omit<ScoreAuditLog, 'id' | 'timestamp'>) => void;

  // Student Data Audit Log (Lịch sử kiểm toán vết trạng thái trước/sau khi thay đổi dữ liệu Đoàn viên)
  studentAuditLogs: StudentAuditLog[];
  recordStudentAuditLog: (
    actionType: string,
    actionTitle: string,
    beforeState: Partial<StudentScoreRecord> | null,
    afterState: Partial<StudentScoreRecord> | null,
    reason?: string,
    studentMeta?: { studentId?: string; studentName?: string; classCode?: string; facultyCode?: string }
  ) => void;

  // System Activity Log (Nhật ký hoạt động & Thay đổi quyền toàn hệ thống cho Cấp 4)
  systemActivityLogs: SystemActivityLog[];
  addSystemActivityLog: (logData: Omit<SystemActivityLog, 'id' | 'timestamp'>) => void;

  // Custom Navigation Menu Management (Chỉnh sửa menu thủ công Cấp 4)
  customNavItems: CustomNavItem[];
  updateCustomNavItems: (items: CustomNavItem[]) => void;
  resetCustomNavItems: () => void;

  // Custom Footer Management (Chỉnh sửa footer Cấp 4)
  footerConfig: FooterConfig;
  updateFooterConfig: (updates: Partial<FooterConfig>) => void;
  resetFooterConfig: () => void;

  // Custom Header Branding Management (Chỉnh sửa Logo & Tiêu đề Header Cấp 4)
  headerBranding: HeaderBranding;
  updateHeaderBranding: (updates: Partial<HeaderBranding>) => Promise<{ success: boolean; error?: string }>;
  resetHeaderBranding: () => Promise<{ success: boolean; error?: string }>;

  // System Dictionary & Terminology Management (Danh mục từ, cụm từ Cấp 4)
  systemTerms: SystemTermItem[];
  updateSystemTerms: (terms: SystemTermItem[]) => void;
  resetSystemTerms: () => void;
  getTerm: (keyOrText: string, fallback?: string) => string;
  replaceTerms: (text: string) => string;

  // Notification Toast Stack & Push System
  toasts: ToastItem[];
  toast: ToastItem | null;
  showToast: (
    message: string,
    type?: 'success' | 'info' | 'warning' | 'error',
    options?: {
      title?: string;
      category?: ToastCategory;
      actionLabel?: string;
      onAction?: () => void;
      durationMs?: number;
    }
  ) => void;
  dismissToast: (id: string) => void;

  // Specific push notification triggers
  notifyNewActivity: (act: ActivitySubmission) => void;
  notifyScoreUpdated: (student: StudentScoreRecord, scoreDiff?: number, note?: string) => void;
  notifyBatchScoresUpdated: (count: number, summary?: string) => void;

  // Student Push Notification System (Thông Báo Đẩy Cho Sinh Viên)
  studentPushNotifications: StudentPushNotification[];
  sendStudentPushNotification: (
    studentId: string,
    data: {
      type: 'activity_approved' | 'score_updated' | 'proof_approved' | 'system';
      title: string;
      message: string;
      scoreDiff?: number;
      activityId?: string;
      activityTitle?: string;
      linkTab?: string;
    }
  ) => void;
  markPushNotificationAsRead: (id: string) => void;
  markAllPushNotificationsAsRead: (studentId?: string) => void;
  clearPushNotifications: (studentId?: string) => void;
  requestNotificationPermission: () => Promise<NotificationPermission>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ACTIVITIES: 'nlu_youth_activities_v2026_lock',
  STUDENTS: 'nlu_youth_students_v2026_lock',
  STUDENTS_SNAPSHOT: 'nlu_youth_students_backup_snapshot_v2026',
  PROOFS: 'nlu_youth_proofs_v2026_lock',
  CLASSES: 'nlu_youth_classes_v2026_lock',
  ACCOUNTS: 'nlu_youth_accounts_v2026_lock',
  ORGS: 'nlu_youth_orgs_v2026_lock',
  CURRENT_ROLE: 'nlu_youth_current_role_v2026_lock',
  CERT_TEMPLATE: 'nlu_youth_cert_template_v2026',
  CERTIFICATES: 'nlu_youth_certificates_v2026',
  BACKUPS: 'nlu_youth_backups_v2026',
  AUDIT_LOGS: 'nlu_youth_score_audit_logs_v2026',
  STUDENT_AUDIT_LOGS: 'nlu_youth_student_audit_logs_v2026',
  PUSH_NOTIFICATIONS: 'nlu_youth_student_push_notifications_v2026',
  THEME: 'nlu_youth_theme_v2026',
  SYSTEM_ACTIVITY_LOGS: 'nlu_youth_system_activity_logs_v2026',
  NAV_MENU: 'nlu_youth_nav_menu_v2026',
  FOOTER_CONFIG: 'nlu_youth_footer_config_v2026',
  HEADER_BRANDING: 'nlu_youth_header_branding_v2026',
  SYSTEM_DICTIONARY: 'nlu_youth_system_dictionary_v2026',
  TARGETS: 'nlu_youth_targets_v2026',
  CATALOG_AWARDS: 'nlu_youth_catalog_awards_v2026',
  CATALOG_RESEARCH: 'nlu_youth_catalog_research_v2026',
  CATALOG_POSITIONS: 'nlu_youth_catalog_positions_v2026',
  CATALOG_PARTY: 'nlu_youth_catalog_party_v2026',
  CATALOG_PERSONNEL_QUOTAS: 'nlu_youth_catalog_personnel_quotas_v2026'
};

export const DEFAULT_HEADER_BRANDING: HeaderBranding = {
  logoUrl: '',
  secondaryLogoUrl: '',
  badgeText: 'Đoàn - Hội Nông Lâm',
  titleText: 'NLU YOUTH 2026',
  subtitleText: 'Tuổi trẻ Đại học Nông Lâm TP. Hồ Chí Minh'
};

export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  orgName: 'ĐOÀN THANH NIÊN - HỘI SINH VIÊN',
  unitName: 'Trường Đại học Nông Lâm TP. Hồ Chí Minh',
  systemTitle: 'Hệ thống Quản lý Hoạt động, Điểm Rèn luyện & Xếp loại Đoàn viên (NLU Youth 2026)',
  contactEmail: 'doanhoi@hcmuaf.edu.vn',
  hotline: '(028) 3896 6780',
  address: 'Khu phố 6, Phường Linh Trung, TP. Thủ Đức, TP. Hồ Chí Minh',
  websiteUrl: 'https://doantruong.hcmuaf.edu.vn',
  copyrightText: '© 2026 Ban Thường vụ Đoàn Trường ĐH Nông Lâm TP.HCM. Bảo lưu mọi quyền.',
  customLinks: [
    { label: 'Website ĐH Nông Lâm', url: 'https://hcmuaf.edu.vn' },
    { label: 'Fanpage Tuổi Trẻ NLU', url: 'https://facebook.com/tuoitrenlu' }
  ]
};

export const DEFAULT_NAV_ITEMS: CustomNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', iconName: 'BarChart3', visible: true, minLevel: 0, order: 1 },
  { id: 'targets', label: 'Chỉ Tiêu & Đánh Giá', iconName: 'Target', visible: true, minLevel: 1, order: 2 },
  { id: 'activities', label: 'Quản Lý Hoạt Động', iconName: 'Calendar', visible: true, minLevel: 1, order: 3 },
  { id: 'student-portal', label: 'Cổng Sinh Viên & SV5T', iconName: 'Award', visible: true, minLevel: 1, order: 4 },
  { id: 'score-roster', label: 'Danh Mục & Sổ Điểm SV', iconName: 'FileText', visible: true, minLevel: 1, order: 5 },
  { id: 'organizations', label: 'Danh mục Đơn vị', iconName: 'Building2', visible: true, minLevel: 3, order: 6 },
  { id: 'certificates', label: 'Giấy Chứng Nhận Điện Tử', iconName: 'Award', visible: false, minLevel: 1, order: 7 },
  { id: 'accounts', label: 'Cấp Quyền & Tài Khoản', iconName: 'Key', visible: true, minLevel: 4, order: 8 },
  { id: 'activity-logs', label: 'Nhật Ký Hệ Thống', iconName: 'History', visible: true, minLevel: 4, order: 9 },
  { id: 'drive', label: 'Google Drive & Hồ Sơ', iconName: 'HardDrive', visible: true, minLevel: 1, order: 10 },
  { id: 'system-catalogs', label: 'Quản Lý Quy Điểm', iconName: 'Settings2', visible: true, minLevel: 4, order: 11 },
];

export type AuthStatus = 'initializing' | 'authenticated-loading-account' | 'authorized' | 'unauthorized' | 'signed-out' | 'error';

export const DEFAULT_GUEST_USER: UserProfile = {
  id: 'usr_guest',
  fullName: 'Khách vãng lai (Chưa đăng nhập)',
  email: 'guest@tuoitrenonglam.com',
  isAuthenticated: false,
  currentRole: {
    roleId: 'role_guest',
    roleLevel: 0,
    roleName: 'Cấp 0 - Khách vãng lai (Chưa đăng nhập Google SSO)',
    orgCode: 'GUEST',
    orgName: 'Toàn trường (Chỉ xem tổng quan)',
  },
  availableRoles: [
    {
      roleId: 'role_guest',
      roleLevel: 0,
      roleName: 'Cấp 0 - Khách vãng lai (Chưa đăng nhập Google SSO)',
      orgCode: 'GUEST',
      orgName: 'Toàn trường (Chỉ xem tổng quan)',
    }
  ]
};

export const resolveUserRoleFromAccount = (
  googleUserInstance: User | null,
  accountList: SystemUserAccount[],
  studentList: StudentScoreRecord[]
): UserProfile => {
  if (!googleUserInstance || !googleUserInstance.email) {
    return DEFAULT_GUEST_USER;
  }

  const cleanEmail = googleUserInstance.email.toLowerCase().trim();
  const matchedAccount = accountList.find(a => a.email.toLowerCase().trim() === cleanEmail);

  if (matchedAccount) {
    const acc: SystemUserAccount = matchedAccount;

    if (acc.status === 'Inactive') {
      return {
        id: acc.id,
        email: googleUserInstance.email,
        fullName: googleUserInstance.displayName || acc.fullName,
        avatarUrl: googleUserInstance.photoURL || undefined,
        isAuthenticated: false,
        currentRole: {
          roleId: `role_inactive_${acc.id}`,
          roleLevel: 0,
          roleName: 'Tài khoản Đang Bị Tạm Khóa (Vui lòng liên hệ BTV Đoàn trường)',
          orgCode: acc.orgCode,
          orgName: acc.orgName,
        },
        availableRoles: []
      };
    }

    const roleName =
      acc.roleLevel === 4
        ? 'Cấp 4 - Ban Thường vụ Đoàn trường (Quản trị hệ thống)'
        : acc.roleLevel === 3
        ? `Cấp 3 - Ban Chấp hành Đoàn Khoa ${acc.orgName || acc.orgCode}`
        : acc.roleLevel === 2
        ? (acc.classCode
            ? `Cấp 2 - Ban Chấp hành Chi đoàn ${acc.classCode}`
            : `Cấp 2 - Ban Chủ nhiệm ${acc.orgName || acc.orgCode}`)
        : 'Cấp 1 - Đoàn viên / Sinh viên';

    const role: UserRole = {
      roleId: `role_${acc.roleLevel}_${acc.id}`,
      roleLevel: acc.roleLevel,
      roleName,
      orgCode: acc.orgCode,
      orgName: acc.orgName,
      classCode: acc.classCode,
    };

    return {
      id: acc.id,
      email: googleUserInstance.email,
      fullName: googleUserInstance.displayName || acc.fullName,
      avatarUrl: googleUserInstance.photoURL || undefined,
      isAuthenticated: true,
      currentRole: role,
      availableRoles: [role],
      studentId: acc.roleLevel === 1 ? (acc.studentId || undefined) : undefined
    };
  }

  // Check student roster by verified email / UID / verified official domain suffix
  const isOfficialStudentEmail = cleanEmail.endsWith('@hcmuaf.edu.vn') || cleanEmail.endsWith('@st.hcmuaf.edu.vn');
  const studentPrefix = isOfficialStudentEmail ? cleanEmail.split('@')[0].toLowerCase() : null;

  const matchedStudent = studentList.find(s => {
    if (!s || s.deleted || s.isDeleted) return false;
    if (s.email && s.email.toLowerCase().trim() === cleanEmail) return true;
    if (s.userId && googleUserInstance.uid && s.userId === googleUserInstance.uid) return true;
    if (s.uid && googleUserInstance.uid && s.uid === googleUserInstance.uid) return true;
    return false;
  });

  if (matchedStudent) {
    const role: UserRole = {
      roleId: `role_std_${matchedStudent.studentId}`,
      roleLevel: 1,
      roleName: `Cấp 1 - Sinh viên (${matchedStudent.fullName} • ${matchedStudent.studentId})`,
      orgCode: matchedStudent.facultyCode,
      orgName: matchedStudent.facultyCode,
      classCode: matchedStudent.classCode,
    };

    return {
      id: matchedStudent.id,
      email: googleUserInstance.email,
      fullName: googleUserInstance.displayName || matchedStudent.fullName,
      avatarUrl: googleUserInstance.photoURL || undefined,
      isAuthenticated: true,
      currentRole: role,
      availableRoles: [role],
      studentId: matchedStudent.studentId
    };
  }

  // Not authorized in system
  return {
    id: `usr_unauth_${Date.now()}`,
    email: googleUserInstance.email,
    fullName: googleUserInstance.displayName || googleUserInstance.email,
    avatarUrl: googleUserInstance.photoURL || undefined,
    isAuthenticated: false,
    currentRole: {
      roleId: 'role_guest_unauthorized',
      roleLevel: 0,
      roleName: 'Khách (Chưa Được Cấp Quyền Trong Hệ Thống)',
      orgCode: 'UNAUTHORIZED',
      orgName: 'Chưa được phân quyền cán bộ',
    },
    availableRoles: []
  };
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const academicYear = CURRENT_ACADEMIC_YEAR;

  // Multi-stage auth refs for generation guards and SSO resolution
  const authGenerationRef = React.useRef(0);
  const authResolvePromiseRef = React.useRef<{
    resolve: (res: { status: AuthStatus; user: UserProfile; error?: string }) => void;
    reject: (err: any) => void;
  } | null>(null);

  // User & Roles (Default to DEFAULT_GUEST_USER + initializing authStatus for strict security)
  const [user, setUser] = useState<UserProfile>(DEFAULT_GUEST_USER);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('initializing');

  // Global Dark Mode Theme (Default to saved preference or system preference)
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) {
      console.warn('Failed to persist theme to localStorage', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      showToast(
        nextTheme === 'dark'
          ? '🌙 Đã bật chế độ ban đêm (Dark Mode) - Dịu mắt khi học tập & làm việc'
          : '☀️ Đã chuyển sang chế độ ban ngày (Light Mode)',
        'info',
        { title: 'Giao Diện Hệ Thống', durationMs: 2500 }
      );
      return nextTheme;
    });
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  };

  // Tracks sync state of individual Firestore subscription streams (monitors 'loading' | 'success' | 'error' statuses)
  const syncSourcesRef = React.useRef<Record<string, { status: 'loading' | 'success' | 'error'; fromCache: boolean; hasPendingWrites: boolean; errorMessage?: string }>>({});

  // Synchronization Status & Offline State
  const [syncStatus, setSyncStatus] = useState<SyncStatusInfo>({
    state: 'syncing',
    lastSyncedAt: undefined,
    pendingCount: 0,
    errorMessage: 'Đang khởi tạo kết nối Cloud Firestore...'
  });

  // Initial Firestore Data Loading State (Controls Skeleton Shimmer Counters & Loaders)
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Transition out of skeleton loading once initial Firestore streams have settled
  useEffect(() => {
    if (syncStatus.state === 'synced' || syncStatus.state === 'error' || syncStatus.state === 'offline') {
      const timer = setTimeout(() => {
        setIsInitialLoading(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [syncStatus.state]);

  // Safety fallback: ensure skeleton always smoothly reveals data within 2.2 seconds even on high latency
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  const updateSyncSource = React.useCallback((sourceName: string, meta?: { fromCache: boolean; hasPendingWrites: boolean; error?: string }) => {
    if (!meta) return;
    const status = meta.error ? 'error' : 'success';
    syncSourcesRef.current[sourceName] = {
      status,
      fromCache: meta.fromCache,
      hasPendingWrites: meta.hasPendingWrites,
      errorMessage: meta.error
    };
    
    // Required sources check based on auth status
    const required = authStatus === 'authorized' ? ['activities', 'students'] : ['activities'];
    
    setSyncStatus(prev => {
      // Find statuses of required sources, defaulting to 'loading' if not yet registered
      const sourcesWithState = required.map(src => {
        const current = syncSourcesRef.current[src];
        if (!current) {
          return {
            status: 'loading' as const,
            fromCache: false,
            hasPendingWrites: false,
            errorMessage: undefined
          };
        }
        return current;
      });
      
      const loadingSources = required.filter((src, idx) => sourcesWithState[idx].status === 'loading');
      const errorSources = required.filter((src, idx) => sourcesWithState[idx].status === 'error');
      
      let state: 'synced' | 'syncing' | 'offline' | 'error' = 'synced';
      let errorMsg = '';
      let pendingCount = 0;
      
      if (loadingSources.length > 0) {
        state = 'syncing';
        errorMsg = `Đang tải và đồng bộ dữ liệu bắt buộc (${loadingSources.join(', ')})...`;
      } else if (errorSources.length > 0) {
        state = 'error';
        const firstErrSrc = errorSources[0];
        errorMsg = syncSourcesRef.current[firstErrSrc]?.errorMessage || `Lỗi đồng bộ nguồn dữ liệu: ${firstErrSrc}`;
      } else {
        // All required sources are in 'success' status
        const anyPendingWrites = sourcesWithState.some(s => s.hasPendingWrites);
        const anyFromCache = sourcesWithState.some(s => s.fromCache);
        
        pendingCount = sourcesWithState.filter(s => s.hasPendingWrites).length;
        
        if (anyPendingWrites) {
          state = 'syncing';
          errorMsg = 'Đang đồng bộ các thay đổi lên đám mây...';
        } else if (anyFromCache) {
          state = navigator.onLine ? 'syncing' : 'offline';
          errorMsg = navigator.onLine 
            ? 'Đang cập nhật dữ liệu mới nhất từ máy chủ...' 
            : 'Hệ thống đang hoạt động ngoại tuyến (Offline persistence).';
        } else if (!navigator.onLine) {
          state = 'offline';
          errorMsg = 'Đã ngắt kết nối mạng.';
        }
      }
      
      return {
        ...prev,
        state,
        lastSyncedAt: state === 'synced' ? new Date().toISOString() : prev.lastSyncedAt,
        pendingCount,
        errorMessage: errorMsg || undefined
      };
    });
  }, [authStatus]);

  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, state: 'syncing', errorMessage: 'Đã kết nối lại mạng Internet. Đang cập nhật từ máy chủ...' }));
      showToast('Đã kết nối lại mạng Internet. Đang đồng bộ với Cloud Firestore.', 'info', { title: 'Trạng Thái Đồng Bộ', durationMs: 3000 });
      firestoreRetryQueue.processQueue().then(res => {
        if (res.successCount > 0) {
          showToast(`Đã tự động thử lại và lưu thành công ${res.successCount} thao tác từ Hàng Đợi (Retry-Queue) lên Cloud Firestore!`, 'success', { title: 'Đồng Bộ Hàng Đợi Thành Công' });
        }
      });
    };
    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, state: 'offline', errorMessage: 'Hệ thống đang hoạt động ngoại tuyến.' }));
      showToast('Đang ở chế độ ngoại tuyến (Offline). Dữ liệu sẽ lưu tạm vào bộ nhớ thiết bị.', 'warning', { title: 'Mất Kết Nối Mạng', durationMs: 4000 });
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user.currentRole.roleLevel]);

  // Google OAuth State (In-Memory Token Cache)
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Push Toast Notifications Queue
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const showToast = (
    message: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'success',
    options?: {
      title?: string;
      category?: ToastCategory;
      actionLabel?: string;
      onAction?: () => void;
      durationMs?: number;
    }
  ) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastItem = {
      id,
      message,
      type,
      title: options?.title,
      category: options?.category || 'system',
      actionLabel: options?.actionLabel,
      onAction: options?.onAction,
      createdAt: Date.now(),
      durationMs: options?.durationMs || 5000
    };

    setToasts(prev => [newToast, ...prev].slice(0, 4));

    // Web Audio chime for push notifications
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const baseFreq =
          options?.category === 'score'
            ? 659.25 // E5
            : options?.category === 'activity'
            ? 523.25 // C5
            : 587.33; // D5
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.28);
      }
    } catch {}

    // Auto dismiss timer
    setTimeout(() => {
      dismissToast(id);
    }, options?.durationMs || 5000);
  };

  // Dedicated push notification when NEW ACTIVITY is registered
  const notifyNewActivity = (act: ActivitySubmission) => {
    showToast(
      `Chương trình "${act.title}" (Mã: ${act.id}) vừa được thêm vào kế hoạch Đoàn - Hội. Đơn vị tổ chức: ${act.orgName}.`,
      'success',
      {
        title: 'Hoạt Động Đoàn - Hội Mới',
        category: 'activity',
        actionLabel: 'Xem Kế Hoạch',
        onAction: () => setActiveTab('activities'),
        durationMs: 6500
      }
    );
  };

  // Dedicated push notification when STUDENT SCORE is updated
  const notifyScoreUpdated = (student: StudentScoreRecord, scoreDiff?: number, note?: string) => {
    const diffText = scoreDiff !== undefined ? (scoreDiff >= 0 ? ` (+${scoreDiff}đ)` : ` (${scoreDiff}đ)`) : '';
    showToast(
      `Điểm rèn luyện của sinh viên ${student.fullName} (MSSV: ${student.studentId}) đã được cập nhật${diffText}: Tổng ${student.totalScore} điểm • Xếp loại: ${student.rankGrade}.${note ? ` ${note}` : ''}`,
      'success',
      {
        title: 'Cập Nhật Điểm Rèn Luyện',
        category: 'score',
        actionLabel: 'Xem Sổ Điểm',
        onAction: () => setActiveTab('score-roster'),
        durationMs: 6000
      }
    );
  };

  // Dedicated push notification when BATCH SCORES are updated
  const notifyBatchScoresUpdated = (count: number, summary?: string) => {
    showToast(
      `Đã cập nhật điểm rèn luyện và tính lại xếp loại thi đua cho ${count} sinh viên!${summary ? ` ${summary}` : ''}`,
      'success',
      {
        title: 'Cập Nhật Điểm Hàng Loạt',
        category: 'score',
        actionLabel: 'Xem Bảng Xếp Loại',
        onAction: () => setActiveTab('score-roster'),
        durationMs: 6000
      }
    );
  };

  // State: Student Push Notifications (Hệ thống thông báo đẩy sinh viên)
  const [studentPushNotifications, setStudentPushNotifications] = useState<StudentPushNotification[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PUSH_NOTIFICATIONS);
      return stored ? JSON.parse(stored) : INITIAL_PUSH_NOTIFICATIONS;
    } catch {
      return INITIAL_PUSH_NOTIFICATIONS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PUSH_NOTIFICATIONS, JSON.stringify(studentPushNotifications));
    } catch {}
  }, [studentPushNotifications]);

  const sendStudentPushNotification = (
    studentId: string,
    data: {
      type: 'activity_approved' | 'score_updated' | 'proof_approved' | 'system';
      title: string;
      message: string;
      scoreDiff?: number;
      activityId?: string;
      activityTitle?: string;
      linkTab?: string;
    }
  ) => {
    const student = students.find(s => s.studentId === studentId);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestampStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const newNotif: StudentPushNotification = {
      id: `push_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      studentId,
      studentName: student?.fullName || user.fullName,
      type: data.type,
      title: data.title,
      message: data.message,
      scoreDiff: data.scoreDiff,
      activityId: data.activityId,
      activityTitle: data.activityTitle,
      createdAt: timestampStr,
      isRead: false,
      linkTab: data.linkTab || 'student-portal'
    };

    setStudentPushNotifications(prev => [newNotif, ...prev]);

    // 1. Browser Native Web Notification (if permission granted)
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(data.title, {
          body: data.message,
          icon: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
          tag: newNotif.id
        });
      }
    } catch (e) {
      console.warn('Browser Web Notification failed:', e);
    }

    // 2. In-app Push Toast Stack with Action callback & Web Audio chime
    showToast(data.message, 'success', {
      title: data.title,
      category: data.type === 'activity_approved' ? 'activity' : 'score',
      actionLabel: data.type === 'activity_approved' ? 'Xem Hoạt Động' : 'Xem Sổ Điểm',
      onAction: () => setActiveTab(data.linkTab || 'student-portal'),
      durationMs: 7000
    });
  };

  const markPushNotificationAsRead = (id: string) => {
    setStudentPushNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllPushNotificationsAsRead = (studentId?: string) => {
    setStudentPushNotifications(prev =>
      prev.map(n => (!studentId || n.studentId === studentId ? { ...n, isRead: true } : n))
    );
  };

  const clearPushNotifications = (studentId?: string) => {
    if (studentId) {
      setStudentPushNotifications(prev => prev.filter(n => n.studentId !== studentId));
    } else {
      setStudentPushNotifications([]);
    }
  };

  const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      showToast('Trình duyệt hiện tại không hỗ trợ Web Notification API.', 'warning');
      return 'denied';
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        showToast('Đã kích hoạt hệ thống thông báo đẩy (Push Notifications) thành công!', 'success');
        sendStudentPushNotification(user.studentId || '22130001', {
          type: 'system',
          title: '🔔 Đã Bật Thông Báo Đẩy NLU',
          message: 'Hệ thống sẽ gửi thông báo đẩy trực tiếp cho bạn mỗi khi có hoạt động được duyệt hoặc điểm rèn luyện thay đổi.',
          linkTab: 'student-portal'
        });
      } else if (permission === 'denied') {
        showToast('Bạn đã từ chối quyền thông báo trên trình duyệt. Vui lòng cho phép quyền thông báo trong cài đặt trình duyệt.', 'warning');
      }
      return permission;
    } catch (err) {
      console.warn('Notification permission request failed', err);
      return 'denied';
    }
  };

  // State: All Activities (Persistent collection in Firestore & localStorage, including soft-deleted items)
  const [allActivities, setAllActivities] = useState<ActivitySubmission[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      if (stored !== null) {
        const parsed: ActivitySubmission[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const seen = new Set<string>();
          const filtered = parsed.filter(act => {
            if (!act?.id || seen.has(act.id)) return false;
            seen.add(act.id);
            return true;
          });
          if (filtered.length > 0) return filtered;
        }
      }
      return INITIAL_ACTIVITIES;
    } catch {
      return INITIAL_ACTIVITIES;
    }
  });

  // Active activities for application consumption (excludes soft-deleted items by default)
  const activities = React.useMemo(() => allActivities.filter(a => !a.deleted && !a.isDeleted), [allActivities]);
  // Soft-deleted activities for Admin Recovery Trash Tool
  const deletedActivities = React.useMemo(() => allActivities.filter(a => Boolean(a.deleted || a.isDeleted)), [allActivities]);

  // Compatibility helper: updates allActivities while preserving soft-deleted ones
  const setActivities = React.useCallback((updater: ActivitySubmission[] | ((prev: ActivitySubmission[]) => ActivitySubmission[])) => {
    setAllActivities(prevAll => {
      const activeOnly = prevAll.filter(a => !a.deleted && !a.isDeleted);
      const softDeleted = prevAll.filter(a => Boolean(a.deleted || a.isDeleted));
      const nextActive = typeof updater === 'function' ? updater(activeOnly) : updater;
      // Merge nextActive and softDeleted ensuring unique ids
      const map = new Map<string, ActivitySubmission>();
      softDeleted.forEach(a => map.set(a.id, a));
      nextActive.forEach(a => map.set(a.id, a));
      return Array.from(map.values());
    });
  }, []);

  // State: All Students (Persistent collection in Firestore, initialized with local/seed data so no view is empty)
  const [allStudents, setAllStudents] = useState<StudentScoreRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  // Active students for application consumption (excludes soft-deleted items by default)
  const students = React.useMemo(() => allStudents.filter(s => !s.deleted && !s.isDeleted), [allStudents]);
  // Soft-deleted students for Admin Recovery Trash Tool
  const deletedStudents = React.useMemo(() => allStudents.filter(s => Boolean(s.deleted || s.isDeleted)), [allStudents]);

  // Compatibility helper: updates allStudents while preserving soft-deleted ones and syncing localStorage
  const setStudents = React.useCallback((updater: StudentScoreRecord[] | ((prev: StudentScoreRecord[]) => StudentScoreRecord[])) => {
    setAllStudents(prevAll => {
      const activeOnly = prevAll.filter(s => !s.deleted && !s.isDeleted);
      const softDeleted = prevAll.filter(s => Boolean(s.deleted || s.isDeleted));
      const nextActive = typeof updater === 'function' ? updater(activeOnly) : updater;
      const map = new Map<string, StudentScoreRecord>();
      softDeleted.forEach(s => map.set(s.studentId.trim().toLowerCase(), s));
      nextActive.forEach(s => map.set(s.studentId.trim().toLowerCase(), s));
      const result = Array.from(map.values());
      try {
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(result));
      } catch (e) {
        console.warn('Failed to save updated students to localStorage:', e);
      }
      return result;
    });
  }, []);

  // State: Selected Student to view in Student Portal & SV5T
  const [selectedPortalStudentId, setSelectedPortalStudentId] = useState<string | null>(null);

  // State: Self Proofs
  const [selfProofs, setSelfProofs] = useState<StudentSelfProof[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROOFS);
      if (stored !== null) return JSON.parse(stored);
      return INITIAL_SELF_PROOFS;
    } catch {
      return INITIAL_SELF_PROOFS;
    }
  });

  // State: Accounts (Initialized with local/seed accounts so account management view is always complete)
  const [accounts, setAccounts] = useState<SystemUserAccount[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_SYSTEM_ACCOUNTS;
    } catch {
      return INITIAL_SYSTEM_ACCOUNTS;
    }
  });

  // State: Organizations (Flexible List)
  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ORGS);
      if (stored !== null) return JSON.parse(stored);
      return ORGANIZATIONS_LIST;
    } catch {
      return ORGANIZATIONS_LIST;
    }
  });

  // State: Branch Classes (Merged with latest master branch classes and deduplicated)
  const [branchClasses, setBranchClasses] = useState<BranchClass[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CLASSES);
      let list = BRANCH_CLASSES;
      if (stored !== null) {
        const parsed: BranchClass[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          list = [...parsed, ...BRANCH_CLASSES];
        }
      }
      const seenId = new Set<string>();
      const seenCode = new Set<string>();
      const result: BranchClass[] = [];
      list.forEach(item => {
        if (!item || !item.code) return;
        const normCode = item.code.trim().toUpperCase();
        const normId = (item.id || normCode).trim().toLowerCase();
        if (!seenId.has(normId) && !seenCode.has(normCode)) {
          seenId.add(normId);
          seenCode.add(normCode);
          result.push({
            ...item,
            id: item.id || `cls_${normCode}`
          });
        }
      });
      return result.length > 0 ? result : BRANCH_CLASSES;
    } catch {
      return BRANCH_CLASSES;
    }
  });

  // State: Certificate Template
  const [certificateTemplate, setCertificateTemplate] = useState<CertificateTemplate>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CERT_TEMPLATE);
      if (stored !== null) return JSON.parse(stored);
      return INITIAL_CERTIFICATE_TEMPLATE;
    } catch {
      return INITIAL_CERTIFICATE_TEMPLATE;
    }
  });

  // State: Issued Certificates (Initialized with seed data)
  const [issuedCertificates, setIssuedCertificates] = useState<IssuedCertificate[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CERTIFICATES);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_ISSUED_CERTIFICATES;
    } catch {
      return INITIAL_ISSUED_CERTIFICATES;
    }
  });

  // State: Custom Navigation Menu Items (Cấp 4)
  const [customNavItems, setCustomNavItems] = useState<CustomNavItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.NAV_MENU);
      if (stored !== null) return JSON.parse(stored);
      return DEFAULT_NAV_ITEMS;
    } catch {
      return DEFAULT_NAV_ITEMS;
    }
  });

  // State: Dynamic Scoring Lookups
  const [drlCriteria, setDrlCriteria] = useState<Array<{ id: string; title: string }>>(() => {
    try {
      const stored = localStorage.getItem('nluyouth_drl_criteria');
      return stored ? JSON.parse(stored) : DRL_CRITERIA;
    } catch {
      return DRL_CRITERIA;
    }
  });

  const [sv5tStandards, setSv5tStandards] = useState<Array<Sv5tStandardGroup>>(() => {
    try {
      const stored = localStorage.getItem('nluyouth_sv5t_standards');
      return stored ? JSON.parse(stored) : SV5T_STANDARDS;
    } catch {
      return SV5T_STANDARDS;
    }
  });

  const [rolePointsMatrix, setRolePointsMatrix] = useState<Record<string, { c1: number; c2: number; c3: number; c4: number }>>(() => {
    try {
      const stored = localStorage.getItem('nluyouth_role_points');
      return stored ? JSON.parse(stored) : ROLE_POINTS_MATRIX;
    } catch {
      return ROLE_POINTS_MATRIX;
    }
  });

  const [doanPrograms, setDoanPrograms] = useState<Array<{ id: string; title: string }>>(() => {
    try {
      const stored = localStorage.getItem('nluyouth_doan_programs');
      return stored ? JSON.parse(stored) : DOAN_PROGRAMS;
    } catch {
      return DOAN_PROGRAMS;
    }
  });

  const [hoiPrograms, setHoiPrograms] = useState<Array<{ id: string; title: string }>>(() => {
    try {
      const stored = localStorage.getItem('nluyouth_hoi_programs');
      return stored ? JSON.parse(stored) : HOI_PROGRAMS;
    } catch {
      return HOI_PROGRAMS;
    }
  });

  const [targetScaleConfig, setTargetScaleConfig] = useState<Array<{ id: number; name: string; points: number }>>(() => {
    try {
      const stored = localStorage.getItem('nluyouth_target_scale_config');
      return stored ? JSON.parse(stored) : TARGET_SCALE_CONFIG;
    } catch {
      return TARGET_SCALE_CONFIG;
    }
  });

  // Updaters & Resets
  const updateDrlCriteria = (next: Array<{ id: string; title: string }>) => {
    setDrlCriteria(next);
    localStorage.setItem('nluyouth_drl_criteria', JSON.stringify(next));
  };
  const resetDrlCriteria = () => {
    setDrlCriteria(DRL_CRITERIA);
    localStorage.removeItem('nluyouth_drl_criteria');
  };

  const updateSv5tStandards = (next: Array<Sv5tStandardGroup>) => {
    setSv5tStandards(next);
    localStorage.setItem('nluyouth_sv5t_standards', JSON.stringify(next));
  };
  const resetSv5tStandards = () => {
    setSv5tStandards(SV5T_STANDARDS);
    localStorage.removeItem('nluyouth_sv5t_standards');
  };

  const updateTargetScaleConfig = (next: Array<{ id: number; name: string; points: number }>) => {
    setTargetScaleConfig(next);
    localStorage.setItem('nluyouth_target_scale_config', JSON.stringify(next));
  };
  const resetTargetScaleConfig = () => {
    setTargetScaleConfig(TARGET_SCALE_CONFIG);
    localStorage.removeItem('nluyouth_target_scale_config');
  };

  const updateRolePointsMatrix = (next: Record<string, { c1: number; c2: number; c3: number; c4: number }>) => {
    setRolePointsMatrix(next);
    localStorage.setItem('nluyouth_role_points', JSON.stringify(next));
  };

  const updateDoanPrograms = (next: Array<{ id: string; title: string }>) => {
    setDoanPrograms(next);
    localStorage.setItem('nluyouth_doan_programs', JSON.stringify(next));
  };
  const resetDoanPrograms = () => {
    setDoanPrograms(DOAN_PROGRAMS);
    localStorage.removeItem('nluyouth_doan_programs');
  };

  const updateHoiPrograms = (next: Array<{ id: string; title: string }>) => {
    setHoiPrograms(next);
    localStorage.setItem('nluyouth_hoi_programs', JSON.stringify(next));
  };
  const resetHoiPrograms = () => {
    setHoiPrograms(HOI_PROGRAMS);
    localStorage.removeItem('nluyouth_hoi_programs');
  };

  const updateOrganizations = (next: Organization[]) => {
    setOrganizations(next);
    localStorage.setItem(STORAGE_KEYS.ORGS, JSON.stringify(next));
  };

  // Level 4 Proof Scoring Catalogs State
  const [annualAwardsCatalog, setAnnualAwardsCatalog] = useState<ScoringCatalogItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CATALOG_AWARDS);
      return stored ? JSON.parse(stored) : INITIAL_ANNUAL_AWARDS_CATALOG;
    } catch {
      return INITIAL_ANNUAL_AWARDS_CATALOG;
    }
  });
  const updateAnnualAwardsCatalog = (next: ScoringCatalogItem[]) => {
    setAnnualAwardsCatalog(next);
    localStorage.setItem(STORAGE_KEYS.CATALOG_AWARDS, JSON.stringify(next));
  };

  const [researchAwardsCatalog, setResearchAwardsCatalog] = useState<ScoringCatalogItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CATALOG_RESEARCH);
      return stored ? JSON.parse(stored) : INITIAL_RESEARCH_AWARDS_CATALOG;
    } catch {
      return INITIAL_RESEARCH_AWARDS_CATALOG;
    }
  });
  const updateResearchAwardsCatalog = (next: ScoringCatalogItem[]) => {
    setResearchAwardsCatalog(next);
    localStorage.setItem(STORAGE_KEYS.CATALOG_RESEARCH, JSON.stringify(next));
  };

  const [positionRolesCatalog, setPositionRolesCatalog] = useState<ScoringCatalogItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CATALOG_POSITIONS);
      return stored ? JSON.parse(stored) : INITIAL_POSITION_ROLES_CATALOG;
    } catch {
      return INITIAL_POSITION_ROLES_CATALOG;
    }
  });
  const updatePositionRolesCatalog = (next: ScoringCatalogItem[]) => {
    setPositionRolesCatalog(next);
    localStorage.setItem(STORAGE_KEYS.CATALOG_POSITIONS, JSON.stringify(next));
  };

  const [partyMentorCatalog, setPartyMentorCatalog] = useState<ScoringCatalogItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CATALOG_PARTY);
      return stored ? JSON.parse(stored) : INITIAL_PARTY_MENTOR_CATALOG;
    } catch {
      return INITIAL_PARTY_MENTOR_CATALOG;
    }
  });
  const updatePartyMentorCatalog = (next: ScoringCatalogItem[]) => {
    setPartyMentorCatalog(next);
    localStorage.setItem(STORAGE_KEYS.CATALOG_PARTY, JSON.stringify(next));
  };

  const resetProofCatalogs = () => {
    setAnnualAwardsCatalog(INITIAL_ANNUAL_AWARDS_CATALOG);
    localStorage.setItem(STORAGE_KEYS.CATALOG_AWARDS, JSON.stringify(INITIAL_ANNUAL_AWARDS_CATALOG));
    setResearchAwardsCatalog(INITIAL_RESEARCH_AWARDS_CATALOG);
    localStorage.setItem(STORAGE_KEYS.CATALOG_RESEARCH, JSON.stringify(INITIAL_RESEARCH_AWARDS_CATALOG));
    setPositionRolesCatalog(INITIAL_POSITION_ROLES_CATALOG);
    localStorage.setItem(STORAGE_KEYS.CATALOG_POSITIONS, JSON.stringify(INITIAL_POSITION_ROLES_CATALOG));
    setPartyMentorCatalog(INITIAL_PARTY_MENTOR_CATALOG);
    localStorage.setItem(STORAGE_KEYS.CATALOG_PARTY, JSON.stringify(INITIAL_PARTY_MENTOR_CATALOG));
    showToast('Đã khôi phục các danh mục Khen thưởng, NCKH, Chức vụ & Đảng viên về mặc định!', 'info');
  };

  // State: Ràng buộc số lượng Ban tổ chức & Cộng tác viên theo Cấp chương trình (Cấp 1 - 4)
  const [programPersonnelQuotas, setProgramPersonnelQuotas] = useState<ProgramPersonnelQuota[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CATALOG_PERSONNEL_QUOTAS);
      return stored ? JSON.parse(stored) : DEFAULT_PROGRAM_PERSONNEL_QUOTAS;
    } catch {
      return DEFAULT_PROGRAM_PERSONNEL_QUOTAS;
    }
  });

  const updateProgramPersonnelQuotas = (next: ProgramPersonnelQuota[]) => {
    setProgramPersonnelQuotas(next);
    localStorage.setItem(STORAGE_KEYS.CATALOG_PERSONNEL_QUOTAS, JSON.stringify(next));
    showToast('Đã lưu cấu hình ràng buộc số lượng Ban tổ chức & Cộng tác viên thành công!', 'success');
  };

  const resetProgramPersonnelQuotas = () => {
    setProgramPersonnelQuotas(DEFAULT_PROGRAM_PERSONNEL_QUOTAS);
    localStorage.setItem(STORAGE_KEYS.CATALOG_PERSONNEL_QUOTAS, JSON.stringify(DEFAULT_PROGRAM_PERSONNEL_QUOTAS));
    showToast('Đã khôi phục định mức ràng buộc nhân sự Ban tổ chức & Cộng tác viên về mặc định!', 'info');
  };

  // State: Footer Config (Cấp 4)
  const [footerConfig, setFooterConfig] = useState<FooterConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FOOTER_CONFIG);
      if (stored !== null) return JSON.parse(stored);
      return DEFAULT_FOOTER_CONFIG;
    } catch {
      return DEFAULT_FOOTER_CONFIG;
    }
  });

  // State: Header Branding (Cấp 4 - Custom Logo & Title)
  const [headerBranding, setHeaderBranding] = useState<HeaderBranding>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HEADER_BRANDING);
      if (stored !== null) return JSON.parse(stored);
      return DEFAULT_HEADER_BRANDING;
    } catch {
      return DEFAULT_HEADER_BRANDING;
    }
  });

  // State: System Dictionary (Cấp 4 - Danh mục từ & cụm từ hệ thống)
  const [systemTerms, setSystemTerms] = useState<SystemTermItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SYSTEM_DICTIONARY);
      if (stored !== null) return JSON.parse(stored);
      return DEFAULT_SYSTEM_TERMS;
    } catch {
      return DEFAULT_SYSTEM_TERMS;
    }
  });

  // State: System Backups
  const [backups, setBackups] = useState<BackupRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BACKUPS);
      if (stored !== null) return JSON.parse(stored);
      return INITIAL_BACKUPS;
    } catch {
      return INITIAL_BACKUPS;
    }
  });

  // State: Score Audit Logs (Initialized with local/seed audits)
  const [scoreAuditLogs, setScoreAuditLogs] = useState<ScoreAuditLog[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (stored !== null) return JSON.parse(stored);
      return INITIAL_SCORE_AUDIT_LOGS;
    } catch {
      return INITIAL_SCORE_AUDIT_LOGS;
    }
  });

  // State: Student Data Audit Logs (Initialized with local/seed audits)
  const [studentAuditLogs, setStudentAuditLogs] = useState<StudentAuditLog[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STUDENT_AUDIT_LOGS);
      if (stored !== null) return JSON.parse(stored);
      return [];
    } catch {
      return [];
    }
  });

  // State: Master Targets (Danh mục Chỉ tiêu - Quản lý & Đánh giá Thông minh)
  const [targets, setTargets] = useState<TargetItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TARGETS);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.some((t: any) => t.orgType)) {
          return parsed;
        }
      }
      return INITIAL_TARGETS;
    } catch {
      return INITIAL_TARGETS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TARGETS, JSON.stringify(targets));
    } catch (e) {
      console.warn('Failed to persist targets to localStorage', e);
    }
  }, [targets]);

  const addScoreAuditLog = (logData: Omit<ScoreAuditLog, 'id' | 'timestamp'>) => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestampStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const newLog: ScoreAuditLog = {
      ...logData,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: timestampStr,
      ipAddress: logData.ipAddress || '172.16.8.24 (Mạng Nội Bộ NLU)'
    };
    setScoreAuditLogs(prev => [newLog, ...prev]);
    saveScoreAuditLogToFirestore(newLog).catch(err => console.warn('Score audit log firestore save error:', err));
  };

  // State: System Activity Logs (Initialized with local/seed logs)
  const [systemActivityLogs, setSystemActivityLogs] = useState<SystemActivityLog[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SYSTEM_ACTIVITY_LOGS);
      if (stored !== null) return JSON.parse(stored);
      return INITIAL_SYSTEM_ACTIVITY_LOGS;
    } catch {
      return INITIAL_SYSTEM_ACTIVITY_LOGS;
    }
  });

  const addSystemActivityLog = (logData: Omit<SystemActivityLog, 'id' | 'timestamp'>) => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestampStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const newLog: SystemActivityLog = {
      ...logData,
      id: `act_log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: timestampStr,
      ipAddress: logData.ipAddress || '14.161.45.102 (Đoàn Trường NLU)'
    };
    setSystemActivityLogs(prev => [newLog, ...prev]);
    saveActivityLogToFirestore(newLog).catch(err => console.warn('Firestore log save error:', err));
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SYSTEM_ACTIVITY_LOGS, JSON.stringify(systemActivityLogs));
    } catch (e) {
      console.warn('Failed to persist system activity logs', e);
    }
  }, [systemActivityLogs]);

  // Firestore Realtime Synchronization Engine driven by Auth & Subscription Manager
  useEffect(() => {
    let isDisposed = false;
    syncSourcesRef.current = {};

    let unsubActivities: (() => void) | undefined;
    let unsubStudents: (() => void) | undefined;
    let unsubLogs: (() => void) | undefined;
    let unsubCerts: (() => void) | undefined;
    let unsubNavMenu: (() => void) | undefined;
    let unsubFooter: (() => void) | undefined;
    let unsubHeaderBranding: (() => void) | undefined;
    let unsubDictionary: (() => void) | undefined;
    let unsubAccounts: (() => void) | undefined;
    let unsubTargets: (() => void) | undefined;
    let unsubScoreAudits: (() => void) | undefined;
    let unsubStudentAudits: (() => void) | undefined;

    const initFirestoreSync = async () => {
      if (isDisposed) return;
      try {
        const isConnected = await testFirestoreConnection();
        if (isDisposed) return;

        if (isConnected) {
          setSyncStatus(prev => {
            if (isDisposed) return prev;
            return { ...prev, state: 'syncing', errorMessage: 'Kết nối Firestore thành công. Đang đồng bộ dữ liệu...' };
          });
        } else {
          setSyncStatus(prev => {
            if (isDisposed) return prev;
            return { ...prev, state: 'offline', errorMessage: 'Hệ thống đang sẵn sàng ở chế độ bộ nhớ ngoại tuyến (Offline persistence).' };
          });
        }

        // --- PUBLIC SUBSCRIPTIONS (Unrestricted / Public data) ---

        // 1. Real-time Activities Subscription (Unrestricted, handles offline fallback)
        unsubActivities = subscribeActivities(
          (remoteActivities, metadata) => {
            if (isDisposed) return;
            try {
              if (remoteActivities && remoteActivities.length > 0) {
                setAllActivities(prevAll => {
                  const map = new Map<string, ActivitySubmission>();
                  // 1. Giữ lại toàn bộ hoạt động hiện có ở local để không làm mất hoạt động vừa tạo/import
                  prevAll.forEach(act => {
                    if (act?.id) map.set(act.id, act);
                  });
                  // 2. Cập nhật các hoạt động mới nhất từ Firestore lên trên
                  remoteActivities.forEach(rAct => {
                    if (rAct?.id) {
                      map.set(rAct.id, rAct);
                    }
                  });
                  const merged = Array.from(map.values());
                  if (metadata && !metadata.fromCache) {
                    try {
                      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(merged));
                    } catch (e) {
                      console.warn('Failed to save merged activities to localStorage', e);
                    }
                  }
                  return merged;
                });
                updateSyncSource('activities', metadata);
              }
            } catch (err) {
              console.warn('Error in subscribeActivities handler:', err);
            }
          },
          (err) => {
            if (isDisposed) return;
            const errStr = String(err?.code || err?.message || err);
            console.warn('Activities Firestore sync error:', err);
            updateSyncSource('activities', {
              fromCache: true,
              hasPendingWrites: false,
              error: `Lỗi đồng bộ Hoạt động: ${errStr}`
            });
          }
        );

        if (isDisposed) {
          if (unsubActivities) unsubActivities();
          return;
        }

        // 2. Real-time Navigation Menu Subscription
        unsubNavMenu = subscribeNavigationMenu(
          (remoteNav) => {
            if (isDisposed) return;
            if (remoteNav && remoteNav.length > 0) {
              setCustomNavItems(remoteNav);
              localStorage.setItem(STORAGE_KEYS.NAV_MENU, JSON.stringify(remoteNav));
            }
          },
          (err) => {
            if (isDisposed) return;
            console.warn('Nav menu Firestore sync error:', err);
          }
        );

        if (isDisposed) {
          if (unsubNavMenu) unsubNavMenu();
          return;
        }

        // 3. Real-time Footer Config Subscription
        unsubFooter = subscribeFooterConfig(
          (remoteFooter) => {
            if (isDisposed) return;
            if (remoteFooter && remoteFooter.orgName) {
              setFooterConfig(remoteFooter);
              localStorage.setItem(STORAGE_KEYS.FOOTER_CONFIG, JSON.stringify(remoteFooter));
            }
          },
          (err) => {
            if (isDisposed) return;
            console.warn('Footer Firestore sync error:', err);
          }
        );

        if (isDisposed) {
          if (unsubFooter) unsubFooter();
          return;
        }

        // 4. Real-time Header Branding Subscription
        unsubHeaderBranding = subscribeHeaderBranding(
          (remoteHeader) => {
            if (isDisposed) return;
            if (remoteHeader && (remoteHeader.titleText || remoteHeader.logoUrl !== undefined)) {
              setHeaderBranding(remoteHeader);
              localStorage.setItem(STORAGE_KEYS.HEADER_BRANDING, JSON.stringify(remoteHeader));
            }
          },
          (err) => {
            if (isDisposed) return;
            console.warn('Header branding Firestore sync error:', err);
          }
        );

        if (isDisposed) {
          if (unsubHeaderBranding) unsubHeaderBranding();
          return;
        }

        // 5. Real-time System Dictionary Subscription
        unsubDictionary = subscribeSystemDictionary(
          (remoteDict) => {
            if (isDisposed) return;
            if (remoteDict && remoteDict.terms && remoteDict.terms.length > 0) {
              setSystemTerms(remoteDict.terms);
              localStorage.setItem(STORAGE_KEYS.SYSTEM_DICTIONARY, JSON.stringify(remoteDict.terms));
            }
          },
          (err) => {
            if (isDisposed) return;
            console.warn('System dictionary Firestore sync error:', err);
          }
        );

        if (isDisposed) {
          if (unsubDictionary) unsubDictionary();
          return;
        }

        // 6. Real-time Master Targets Subscription
        unsubTargets = subscribeTargets(
          (remoteTargets) => {
            if (isDisposed) return;
            if (remoteTargets && remoteTargets.length > 0) {
              setTargets(remoteTargets);
              localStorage.setItem(STORAGE_KEYS.TARGETS, JSON.stringify(remoteTargets));
            }
          },
          (err) => {
            if (isDisposed) return;
            console.warn('Targets Firestore sync error:', err);
          }
        );

        if (isDisposed) {
          if (unsubTargets) unsubTargets();
          return;
        }

        // --- PRIVATE SUBSCRIPTIONS (Strictly Gated for Authorized Users & Scoped Query-Level) ---
        const isUserAuthorized = authStatus === 'authorized';

        if (isUserAuthorized) {
          const userScope = {
            roleLevel: user.currentRole.roleLevel,
            orgCode: user.currentRole.orgCode,
            classCode: user.currentRole.classCode,
            studentId: user.studentId
          };

          // 7. Real-time Scoped Students Subscription
          unsubStudents = subscribeStudents(
            (remoteStudents, metadata) => {
              if (isDisposed) return;
              try {
                if (remoteStudents) {
                  setAllStudents(prevAll => {
                    const map = new Map<string, StudentScoreRecord>();
                    let baseList = prevAll;
                    if (!baseList || baseList.length === 0) {
                      try {
                        const stored = localStorage.getItem(STORAGE_KEYS.STUDENTS);
                        if (stored) {
                          const parsed = JSON.parse(stored);
                          if (Array.isArray(parsed) && parsed.length > 0) baseList = parsed;
                        }
                      } catch {}
                    }
                    (baseList || []).forEach(s => {
                      if (s && s.studentId) map.set(s.studentId.trim().toLowerCase(), s);
                    });

                    // Protect local pending unsynced student edits from being overwritten by stale remote Firestore snapshot
                    const pendingQueueItems = firestoreRetryQueue.getItems().filter(i => i.status === 'pending' || i.status === 'processing');
                    const pendingStudentIds = new Set<string>();
                    pendingQueueItems.forEach(item => {
                      if (item.type === 'SAVE_STUDENT' && item.payload?.studentId) {
                        pendingStudentIds.add(String(item.payload.studentId).trim().toLowerCase());
                      } else if (item.type === 'BATCH_SAVE_STUDENTS' && Array.isArray(item.payload)) {
                        item.payload.forEach((st: any) => {
                          if (st?.studentId) pendingStudentIds.add(String(st.studentId).trim().toLowerCase());
                        });
                      }
                    });

                    remoteStudents.forEach(remote => {
                      if (remote && remote.studentId) {
                        const key = remote.studentId.trim().toLowerCase();
                        const local = map.get(key);
                        if (local) {
                          if (pendingStudentIds.has(key)) return;
                          if (local.updatedAt && remote.updatedAt && new Date(local.updatedAt).getTime() > new Date(remote.updatedAt).getTime()) return;
                        }
                        map.set(key, remote);
                      }
                    });
                    const merged = Array.from(map.values());
                    if (merged.length > 0) {
                      try {
                        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(merged));
                      } catch (e) {
                        console.warn('Failed to save merged students to localStorage:', e);
                      }
                    }
                    return merged;
                  });
                  updateSyncSource('students', metadata);
                }
              } catch (err) {
                console.warn('Error in subscribeStudents handler:', err);
              }
            },
            (err) => {
              if (isDisposed) return;
              const errStr = String(err?.code || err?.message || err);
              console.warn('Students Firestore sync error:', err);
              updateSyncSource('students', {
                fromCache: true,
                hasPendingWrites: false,
                error: `Lỗi đồng bộ Sinh viên: ${errStr}`
              });
            },
            { scope: userScope }
          );

          if (isDisposed) {
            if (unsubStudents) unsubStudents();
            return;
          }

          // 8. Real-time Scoped Score Audit Logs Subscription
          unsubScoreAudits = subscribeScoreAuditLogs(
            (remoteAudits) => {
              if (isDisposed) return;
              if (remoteAudits) {
                setScoreAuditLogs(remoteAudits);
                safeLocalStorageSetItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(remoteAudits));
              }
            },
            (err) => {
              if (isDisposed) return;
              console.warn('Score audit logs Firestore sync error:', err);
            },
            { scope: userScope }
          );

          if (isDisposed) {
            if (unsubScoreAudits) unsubScoreAudits();
            return;
          }

          // 8.1. Real-time Scoped Student Data Audit Logs Subscription
          unsubStudentAudits = subscribeStudentAuditLogs(
            (remoteAudits) => {
              if (isDisposed) return;
              if (remoteAudits) {
                setStudentAuditLogs(remoteAudits);
                safeLocalStorageSetItem(STORAGE_KEYS.STUDENT_AUDIT_LOGS, JSON.stringify(remoteAudits));
              }
            },
            (err) => {
              if (isDisposed) return;
              console.warn('Student audit logs Firestore sync error:', err);
            },
            { scope: userScope }
          );

          if (isDisposed) {
            if (unsubStudentAudits) unsubStudentAudits();
            return;
          }

          // 9. Real-time Scoped Issued Certificates Subscription
          unsubCerts = subscribeIssuedCertificates(
            (remoteCerts) => {
              if (isDisposed) return;
              if (remoteCerts) {
                setIssuedCertificates(remoteCerts);
                safeLocalStorageSetItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(remoteCerts));
              }
            },
            (err) => {
              if (isDisposed) return;
              console.warn('Certificates Firestore sync error:', err);
            },
            { scope: userScope }
          );

          if (isDisposed) {
            if (unsubCerts) unsubCerts();
            return;
          }

          // 10. Real-time System Activity Logs Subscription (Cấp 4 Admin Only)
          if (user.currentRole.roleLevel === 4) {
            unsubLogs = subscribeActivityLogs(
              (remoteLogs) => {
                if (isDisposed) return;
                setSystemActivityLogs(remoteLogs);
                safeLocalStorageSetItem(STORAGE_KEYS.SYSTEM_ACTIVITY_LOGS, JSON.stringify(remoteLogs));
              },
              (err) => {
                if (isDisposed) return;
                console.warn('Logs Firestore sync error:', err);
              }
            );
          }

          if (isDisposed) {
            if (unsubLogs) unsubLogs();
            return;
          }

          // 11. Real-time System Accounts Subscription (Cấp 4 Admin Only)
          if (user.currentRole.roleLevel === 4) {
            unsubAccounts = subscribeSystemAccounts(
              (remoteAccounts) => {
                if (isDisposed) return;
                if (remoteAccounts && remoteAccounts.length > 0) {
                  setAccounts(remoteAccounts);
                  safeLocalStorageSetItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(remoteAccounts));
                }
              },
              (err) => {
                if (isDisposed) return;
                console.warn('System accounts Firestore sync error:', err);
              }
            );
          }

          if (isDisposed) {
            if (unsubAccounts) unsubAccounts();
            return;
          }
        } else {
          // When unauthorized or in auth transition, restore/keep allStudents from localStorage so imported roster is preserved
          try {
            const stored = localStorage.getItem(STORAGE_KEYS.STUDENTS);
            if (stored) {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setAllStudents(parsed);
              }
            }
          } catch (e) {
            console.warn('Failed to restore cached students in unauth state:', e);
          }
          setScoreAuditLogs([]);
          setSystemActivityLogs([]);
          setIssuedCertificates([]);
          setAccounts([]);
        }
      } catch (err) {
        if (isDisposed) return;
        console.warn('Firestore subscription initialization error:', err);
      }
    };

    initFirestoreSync();

    return () => {
      isDisposed = true;
      if (unsubActivities) unsubActivities();
      if (unsubStudents) unsubStudents();
      if (unsubLogs) unsubLogs();
      if (unsubCerts) unsubCerts();
      if (unsubNavMenu) unsubNavMenu();
      if (unsubFooter) unsubFooter();
      if (unsubHeaderBranding) unsubHeaderBranding();
      if (unsubDictionary) unsubDictionary();
      if (unsubAccounts) unsubAccounts();
      if (unsubTargets) unsubTargets();
      if (unsubScoreAudits) unsubScoreAudits();
      if (unsubStudentAudits) unsubStudentAudits();
    };
  }, [authStatus, user.id, user.currentRole.roleLevel, user.currentRole.orgCode, user.currentRole.classCode, user.studentId, googleUser?.uid]);

  // Persistent localStorage synchronization effects for state changes (Debounced to keep UI ultra responsive)
  useEffect(() => {
    if (allActivities.length > 0) {
      debouncedSafeLocalStorageSetItem(STORAGE_KEYS.ACTIVITIES, () => JSON.stringify(allActivities), 350);
    }
  }, [allActivities]);

  useEffect(() => {
    if (allStudents && allStudents.length > 0) {
      debouncedSafeLocalStorageSetItem(STORAGE_KEYS.STUDENTS, () => JSON.stringify(allStudents), 350);
    }
  }, [allStudents]);

  // Auto-sync SV5T for students on initial load or activities change (Optimized batch calculation)
  useEffect(() => {
    setAllStudents(prev => computeAllStudentsAutoSv5t(prev, activities, selfProofs));
  }, [activities, selfProofs]);

  useEffect(() => {
    debouncedSafeLocalStorageSetItem(STORAGE_KEYS.PROOFS, () => JSON.stringify(selfProofs), 300);
  }, [selfProofs]);

  useEffect(() => {
    safeLocalStorageSetItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    safeLocalStorageSetItem(STORAGE_KEYS.ORGS, JSON.stringify(organizations));
  }, [organizations]);

  useEffect(() => {
    safeLocalStorageSetItem(STORAGE_KEYS.CLASSES, JSON.stringify(branchClasses));
  }, [branchClasses]);

  useEffect(() => {
    safeLocalStorageSetItem(STORAGE_KEYS.CERT_TEMPLATE, JSON.stringify(certificateTemplate));
  }, [certificateTemplate]);

  useEffect(() => {
    safeLocalStorageSetItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(issuedCertificates));
  }, [issuedCertificates]);

  useEffect(() => {
    safeLocalStorageSetItem(STORAGE_KEYS.BACKUPS, JSON.stringify(backups));
  }, [backups]);

  useEffect(() => {
    debouncedSafeLocalStorageSetItem(STORAGE_KEYS.AUDIT_LOGS, () => JSON.stringify(scoreAuditLogs), 350);
  }, [scoreAuditLogs]);

  // Authentication pipeline with single-doc account lookup driving authStatus & role resolution
  useEffect(() => {
    let isCancelled = false;
    setAuthStatus('initializing');

    const unsubscribe = initAuth(
      async (usr, token) => {
        // Increment auth generation on every auth event
        authGenerationRef.current += 1;
        const localGeneration = authGenerationRef.current;
        const localUid = usr?.uid || null;

        if (isCancelled) return;
        setGoogleUser(usr);
        setAccessToken(token);

        if (!usr || !usr.email) {
          setUser(DEFAULT_GUEST_USER);
          setSelectedPortalStudentId(null);
          setAuthStatus('signed-out');
          
          if (authResolvePromiseRef.current) {
            authResolvePromiseRef.current.resolve({ status: 'signed-out', user: DEFAULT_GUEST_USER });
            authResolvePromiseRef.current = null;
          }
          return;
        }

        setAuthStatus('authenticated-loading-account');

        try {
          // Stage 1: Fetch and validate against system accounts
          const fetchRes = await fetchSystemAccountByEmail(usr.email);
          if (isCancelled || localGeneration !== authGenerationRef.current || auth.currentUser?.uid !== localUid) return;

          if (fetchRes.status === 'found' && fetchRes.account) {
            const resolved = resolveUserRoleFromAccount(usr, [fetchRes.account], []);
            
            if (fetchRes.account.status === 'Inactive') {
              setUser(DEFAULT_GUEST_USER);
              setAuthStatus('unauthorized');
              if (authResolvePromiseRef.current) {
                authResolvePromiseRef.current.resolve({ status: 'unauthorized', user: DEFAULT_GUEST_USER, error: 'Tài khoản đang bị tạm khóa.' });
                authResolvePromiseRef.current = null;
              }
            } else if (resolved.isAuthenticated) {
              setUser(resolved);
              setAuthStatus('authorized');
              if (authResolvePromiseRef.current) {
                authResolvePromiseRef.current.resolve({ status: 'authorized', user: resolved });
                authResolvePromiseRef.current = null;
              }
            } else {
              setUser(resolved);
              setAuthStatus('unauthorized');
              if (authResolvePromiseRef.current) {
                authResolvePromiseRef.current.resolve({ status: 'unauthorized', user: resolved });
                authResolvePromiseRef.current = null;
              }
            }
          } else if (fetchRes.status === 'not_found') {
            // Stage 2: Not in system_accounts. Fetch and validate against student records
            try {
              let matchedStudent: StudentScoreRecord | null = null;
              
              if (usr.email) {
                const sEmailRes = await fetchStudentByEmail(usr.email);
                if (isCancelled || localGeneration !== authGenerationRef.current || auth.currentUser?.uid !== localUid) return;
                
                if (sEmailRes.status === 'found' && sEmailRes.student) {
                  matchedStudent = sEmailRes.student;
                } else if (sEmailRes.status === 'ambiguous') {
                  console.warn('Ambiguous student record by email:', sEmailRes.message);
                  showToast(sEmailRes.message, 'warning');
                } else if (sEmailRes.status === 'error') {
                  throw sEmailRes.error || new Error(sEmailRes.message);
                }
              }
              
              if (!matchedStudent && usr.uid) {
                const sUidRes = await fetchStudentByUid(usr.uid);
                if (isCancelled || localGeneration !== authGenerationRef.current || auth.currentUser?.uid !== localUid) return;
                
                if (sUidRes.status === 'found' && sUidRes.student) {
                  matchedStudent = sUidRes.student;
                } else if (sUidRes.status === 'ambiguous') {
                  console.warn('Ambiguous student record by UID:', sUidRes.message);
                  showToast(sUidRes.message, 'warning');
                } else if (sUidRes.status === 'error') {
                  throw sUidRes.error || new Error(sUidRes.message);
                }
              }

              if (matchedStudent) {
                if (matchedStudent.isDeleted || matchedStudent.deleted) {
                  const resolved = resolveUserRoleFromAccount(usr, [], []);
                  setUser(resolved);
                  setAuthStatus('unauthorized');
                  if (authResolvePromiseRef.current) {
                    authResolvePromiseRef.current.resolve({ status: 'unauthorized', user: resolved, error: 'Hồ sơ sinh viên đã bị xóa khỏi hệ thống.' });
                    authResolvePromiseRef.current = null;
                  }
                  return;
                }

                const resolved = resolveUserRoleFromAccount(usr, [], [matchedStudent]);
                setUser(resolved);
                setAllStudents(prevAll => {
                  const map = new Map<string, StudentScoreRecord>();
                  prevAll.forEach(s => {
                    if (s && s.studentId) map.set(s.studentId.trim().toLowerCase(), s);
                  });
                  map.set(matchedStudent.studentId.trim().toLowerCase(), matchedStudent);
                  return Array.from(map.values());
                });
                setAuthStatus('authorized');
                if (authResolvePromiseRef.current) {
                  authResolvePromiseRef.current.resolve({ status: 'authorized', user: resolved });
                  authResolvePromiseRef.current = null;
                }
              } else {
                // Stage 3: Resolve as unauthorized/guest
                const resolved = resolveUserRoleFromAccount(usr, [], []);
                setUser(resolved);
                setAuthStatus('unauthorized');
                if (authResolvePromiseRef.current) {
                  authResolvePromiseRef.current.resolve({ status: 'unauthorized', user: resolved });
                  authResolvePromiseRef.current = null;
                }
              }
            } catch (studentErr: any) {
              if (isCancelled || localGeneration !== authGenerationRef.current || auth.currentUser?.uid !== localUid) return;
              console.warn('Student fetch error during auth resolution:', studentErr);

              // Try local cache fallback for student or account
              let fallbackUser = null;
              try {
                const rawStds = localStorage.getItem(STORAGE_KEYS.STUDENTS);
                if (rawStds && usr.email) {
                  const cachedStds: StudentScoreRecord[] = JSON.parse(rawStds);
                  const matched = cachedStds.find(s => s.email && s.email.toLowerCase().trim() === usr.email?.toLowerCase().trim());
                  if (matched) {
                    fallbackUser = resolveUserRoleFromAccount(usr, [], [matched]);
                    setAllStudents(prevAll => {
                      const map = new Map<string, StudentScoreRecord>();
                      prevAll.forEach(s => {
                        if (s && s.studentId) map.set(s.studentId.trim().toLowerCase(), s);
                      });
                      map.set(matched.studentId.trim().toLowerCase(), matched);
                      return Array.from(map.values());
                    });
                  }
                }
              } catch (e) {
                console.warn('Fallback student resolution error:', e);
              }

              if (fallbackUser && fallbackUser.isAuthenticated) {
                setUser(fallbackUser);
                setAuthStatus('authorized');
                if (authResolvePromiseRef.current) {
                  authResolvePromiseRef.current.resolve({ status: 'authorized', user: fallbackUser });
                  authResolvePromiseRef.current = null;
                }
              } else {
                setUser(DEFAULT_GUEST_USER);
                setAuthStatus('error');
                if (authResolvePromiseRef.current) {
                  authResolvePromiseRef.current.resolve({ status: 'error', user: DEFAULT_GUEST_USER, error: studentErr.message });
                  authResolvePromiseRef.current = null;
                }
                const msg = String(studentErr?.message || '');
                if (msg.includes('hạn mức') || msg.includes('resource-exhausted') || msg.includes('Quota')) {
                  showToast('Hệ thống đang hoạt động ở chế độ bộ nhớ ngoại tuyến (Offline persistence)', 'info');
                } else {
                  showToast('Lỗi xác thực thông tin sinh viên từ cơ sở dữ liệu', 'warning');
                }
              }
            }
          } else if (fetchRes.status === 'error') {
            console.warn('System account fetch error during auth resolution:', fetchRes.message);

            // Try local cache fallback for account or student
            let fallbackUser = null;
            try {
              const rawAccs = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
              if (rawAccs && usr.email) {
                const cachedAccs: SystemUserAccount[] = JSON.parse(rawAccs);
                const matched = cachedAccs.find(a => a.email && a.email.toLowerCase().trim() === usr.email?.toLowerCase().trim());
                if (matched) {
                  fallbackUser = resolveUserRoleFromAccount(usr, [matched], []);
                }
              }
            } catch (e) {
              console.warn('Fallback account resolution error:', e);
            }

            if (!fallbackUser) {
              try {
                const rawStds = localStorage.getItem(STORAGE_KEYS.STUDENTS);
                if (rawStds && usr.email) {
                  const cachedStds: StudentScoreRecord[] = JSON.parse(rawStds);
                  const matched = cachedStds.find(s => s.email && s.email.toLowerCase().trim() === usr.email?.toLowerCase().trim());
                  if (matched) {
                    fallbackUser = resolveUserRoleFromAccount(usr, [], [matched]);
                    setAllStudents(prevAll => {
                      const map = new Map<string, StudentScoreRecord>();
                      prevAll.forEach(s => {
                        if (s && s.studentId) map.set(s.studentId.trim().toLowerCase(), s);
                      });
                      map.set(matched.studentId.trim().toLowerCase(), matched);
                      return Array.from(map.values());
                    });
                  }
                }
              } catch (e) {
                console.warn('Fallback student resolution error:', e);
              }
            }

            if (fallbackUser && fallbackUser.isAuthenticated) {
              setUser(fallbackUser);
              setAuthStatus('authorized');
              if (authResolvePromiseRef.current) {
                authResolvePromiseRef.current.resolve({ status: 'authorized', user: fallbackUser });
                authResolvePromiseRef.current = null;
              }
            } else {
              setUser(DEFAULT_GUEST_USER);
              setAuthStatus('error');
              if (authResolvePromiseRef.current) {
                authResolvePromiseRef.current.resolve({ status: 'error', user: DEFAULT_GUEST_USER, error: fetchRes.message });
                authResolvePromiseRef.current = null;
              }
              if (fetchRes.message.includes('hạn mức') || fetchRes.message.includes('resource-exhausted') || fetchRes.message.includes('Quota')) {
                showToast('Hệ thống đang hoạt động ở chế độ bộ nhớ ngoại tuyến (Offline persistence)', 'info');
              } else {
                showToast(`Lỗi xác thực quyền tài khoản: ${fetchRes.message}`, 'warning');
              }
            }
          }
        } catch (err: any) {
          if (isCancelled || localGeneration !== authGenerationRef.current || auth.currentUser?.uid !== localUid) return;
          console.warn('Auth pipeline exception:', err);
          setUser(DEFAULT_GUEST_USER);
          setAuthStatus('error');
          if (authResolvePromiseRef.current) {
            authResolvePromiseRef.current.resolve({ status: 'error', user: DEFAULT_GUEST_USER, error: err.message });
            authResolvePromiseRef.current = null;
          }
        }
      },
      () => {
        authGenerationRef.current += 1;
        if (isCancelled) return;
        setGoogleUser(null);
        setAccessToken(null);
        setUser(DEFAULT_GUEST_USER);
        setSelectedPortalStudentId(null);
        setAuthStatus('signed-out');
        if (authResolvePromiseRef.current) {
          authResolvePromiseRef.current.resolve({ status: 'signed-out', user: DEFAULT_GUEST_USER });
          authResolvePromiseRef.current = null;
        }
      }
    );

    return () => {
      isCancelled = true;
      authGenerationRef.current += 1;
      unsubscribe();
    };
  }, []);

  // Google Login Handler (SSO)
  const loginGoogle = async () => {
    setIsConnectingGoogle(true);
    try {
      authResolvePromiseRef.current = null;
      const res = await googleSignIn();
      if (res) {
        // Create an explicit promise to wait for the observer to validate and commit the authenticated state
        const authPromise = new Promise<{ status: AuthStatus; user: UserProfile; error?: string }>((resolve, reject) => {
          authResolvePromiseRef.current = { resolve, reject };
        });

        const finalAuth = await authPromise;

        if (finalAuth.status === 'authorized') {
          showToast(
            `Đăng nhập Google SSO thành công! Cấp quyền: ${finalAuth.user.currentRole.roleName}`,
            'success',
            {
              title: 'Xác Thực Google SSO Thành Công',
              durationMs: 6000
            }
          );
          if (finalAuth.user.currentRole.roleLevel === 1) {
            setActiveTab('student-portal');
          } else {
            setActiveTab('dashboard');
          }
        } else if (finalAuth.status === 'unauthorized') {
          showToast(
            `Tài khoản Google [${res.user.email}] chưa được Cấp Quyền trong hệ thống. Vui lòng liên hệ BTV Đoàn trường (Cấp 4) để được phân quyền cán bộ.`,
            'warning',
            {
              title: 'Chưa Được Cấp Quyền Hệ Thống',
              durationMs: 9000
            }
          );
        } else {
          showToast(
            finalAuth.error || 'Đăng nhập Google SSO thất bại trong khâu xác thực hệ thống',
            'error'
          );
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || 'Đăng nhập Google SSO thất bại', 'error');
    } finally {
      setIsConnectingGoogle(false);
      authResolvePromiseRef.current = null;
    }
  };

  const logoutGoogle = async () => {
    authGenerationRef.current += 1;
    try {
      await firebaseLogout();
      setGoogleUser(null);
      setAccessToken(null);
      setUser(DEFAULT_GUEST_USER);
      setSelectedPortalStudentId(null);
      setAuthStatus('signed-out');
      // Keep allStudents intact from localStorage so roster data is preserved
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.STUDENTS);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) setAllStudents(parsed);
        }
      } catch (e) {}
      setScoreAuditLogs([]);
      setSystemActivityLogs([]);
      setIssuedCertificates([]);
      setAccounts([]);
      setActiveTab('dashboard');
      showToast('Đã đăng xuất tài khoản Google SSO', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  // Switch Role (Only among explicitly assigned roles)
  const switchRole = (roleId: string) => {
    const role = user.availableRoles.find(r => r.roleId === roleId);
    if (role) {
      const isAuth = role.roleLevel > 0;
      setUser(prev => ({
        ...prev,
        currentRole: role,
        isAuthenticated: isAuth
      }));
      localStorage.setItem(STORAGE_KEYS.CURRENT_ROLE, roleId);
      showToast(`Chuyển ngữ cảnh sang: ${role.roleName}`, 'info');

      // Preserve user's current view unless they switched to a role that lacks access to admin-only tabs
      if (role.roleLevel < 4 && (activeTab === 'accounts' || activeTab === 'activity-logs')) {
        setActiveTab('dashboard');
      }
    }
  };

  // Activity Workflow Engine with Automatic Code A001 / B001
  const addActivity = (actData: Omit<ActivitySubmission, 'id' | 'createdAt' | 'status' | 'participants'>): boolean => {
    if (!user.isAuthenticated || user.currentRole.roleLevel === 0) {
      showToast('Vui lòng chọn vai trò hoặc đăng nhập để đăng ký hoạt động!', 'error');
      return false;
    }

    const currentLevel = user.currentRole.roleLevel;
    let initialStatus: ActivitySubmission['status'] = 'Pending_L3';

    if (currentLevel === 4) {
      initialStatus = 'Approved';
    } else if (currentLevel === 3) {
      initialStatus = 'Pending_L4';
    } else {
      initialStatus = 'Pending_L3';
    }

    // Sinh Mã Hoạt động tự động Cấp A -> A001.. Cấp B -> B001.. dựa trên allActivities để tránh trùng lặp
    const hostLvl = actData.hostLevel || 'B';
    const prefix = hostLvl === 'A' ? 'A' : 'B';
    let generatedId = generateActivityCode(hostLvl, allActivities);
    let attempt = 1;
    while (allActivities.some(a => a.id?.trim().toUpperCase() === generatedId.trim().toUpperCase())) {
      const nextNum = (parseInt(generatedId.replace(prefix, ''), 10) || 0) + attempt;
      generatedId = `${prefix}${String(nextNum).padStart(3, '0')}`;
      attempt++;
    }

    // Ràng buộc quy chế Đoàn - Hội trường: Hoạt động do Đoàn trường hoặc Hội Sinh viên trường tổ chức phải từ Cấp 3 trở lên
    let finalProgramLevel = actData.programLevel;
    if (isSchoolYouthUnionOrAssociation(actData.orgCode, actData.orgName)) {
      finalProgramLevel = Math.max(3, finalProgramLevel || 3);
    }

    const val = validateActivityData({ ...actData, programLevel: finalProgramLevel, id: generatedId }, allActivities, true);
    if (!val.isValid) {
      showToast(val.errors.join(' | '), 'error');
      return false;
    }

    const today = new Date().toISOString().split('T')[0];
    const newActivity: ActivitySubmission = {
      ...actData,
      programLevel: finalProgramLevel,
      planYear: actData.planYear || academicYear || '2026-2027',
      id: generatedId,
      status: initialStatus,
      createdAt: today,
      approvedDate: initialStatus === 'Approved' ? today : undefined,
      approvedByL4: initialStatus === 'Approved' ? user.email : undefined,
      createdBy: user.id,
      createdEmail: user.email,
      createdRole: user.currentRole.roleName,
      isLocked: false,
      isRosterSubmitted: false,
      participants: []
    };

    // 1. Cập nhật React state
    setActivities(prev => [newActivity, ...prev]);

    // 2. Ghi tức thì vào localStorage để đảm bảo không bị mất khi F5
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      let parsed = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(parsed)) parsed = [];
      const nextStored = [newActivity, ...parsed.filter((a: any) => a.id !== newActivity.id)];
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(nextStored));
    } catch (err) {
      console.warn('LocalStorage save error in addActivity:', err);
    }

    saveActivityToFirestore(newActivity).catch(err => {
      console.warn('Firestore save activity error:', err);
      firestoreRetryQueue.enqueue('SAVE_ACTIVITY', `Lưu hoạt động "${newActivity.title}"`, newActivity, { docId: newActivity.id, collectionName: 'activities' });
    });
    notifyNewActivity(newActivity);

    // 4. Ghi nhật ký hệ thống Cấp 4
    addSystemActivityLog({
      category: 'ACTIVITY_WORKFLOW',
      actionTitle: initialStatus === 'Approved' ? 'Tạo & Duyệt hoạt động Cấp Trường' : 'Đăng ký kế hoạch hoạt động mới',
      actionDetail: `Đăng ký hoạt động "${newActivity.title}" (#${generatedId}) - Đơn vị: [${newActivity.orgName || newActivity.orgCode}]`,
      severity: 'info',
      performedBy: {
        userId: user.id,
        userName: user.fullName,
        userEmail: user.email,
        roleName: user.currentRole.roleName,
        roleLevel: user.currentRole.roleLevel
      },
      targetEntity: {
        type: 'ACTIVITY',
        id: generatedId,
        name: newActivity.title
      },
      changes: [
        { field: 'hostLevel', newValue: actData.hostLevel },
        { field: 'programLevel', newValue: `Cấp ${actData.programLevel}` },
        { field: 'totalLevelScore', newValue: `${actData.totalLevelScore} điểm` }
      ]
    });

    showToast(`Đăng ký hoạt động "${newActivity.title}" (#${generatedId}) thành công!`, 'success');
    return true;
  };

  // Bulk Import Activities (Mẫu Đăng Ký 15 Mục - Cấp 4)
  const bulkImportActivities = (
    importedList: Omit<ActivitySubmission, 'id' | 'createdAt' | 'status' | 'participants'>[],
    autoApprove: boolean = true
  ) => {
    if (!user.isAuthenticated || user.currentRole.roleLevel < 2) {
      showToast('Bạn không có thẩm quyền nhập hoạt động hàng loạt!', 'error');
      return { successCount: 0, errorCount: importedList.length, importedIds: [] };
    }

    const currentLevel = user.currentRole.roleLevel;
    const initialStatus: ActivitySubmission['status'] =
      currentLevel === 4 && autoApprove ? 'Approved' : currentLevel === 3 ? 'Pending_L4' : 'Pending_L3';

    let errorCount = 0;
    const importedIds: string[] = [];
    const newActivitiesToAdd: ActivitySubmission[] = [];
    let currentPool = [...allActivities];
    const today = new Date().toISOString().split('T')[0];

    importedList.forEach(actData => {
      const cleanTitle = (actData.title || '').trim();
      if (!cleanTitle) {
        errorCount++;
        return;
      }

      const hostLvl = actData.hostLevel || 'B';
      const prefix = hostLvl === 'A' ? 'A' : 'B';
      let generatedId = generateActivityCode(hostLvl, currentPool);
      let attempt = 1;
      while (currentPool.some(a => a.id?.trim().toUpperCase() === generatedId.trim().toUpperCase())) {
        const nextNum = (parseInt(generatedId.replace(prefix, ''), 10) || 0) + attempt;
        generatedId = `${prefix}${String(nextNum).padStart(3, '0')}`;
        attempt++;
      }

      let finalProgramLevel = actData.programLevel;
      if (isSchoolYouthUnionOrAssociation(actData.orgCode, actData.orgName)) {
        finalProgramLevel = Math.max(3, finalProgramLevel || 3);
      }

      const newAct: ActivitySubmission = {
        ...actData,
        programLevel: finalProgramLevel,
        planYear: actData.planYear || academicYear || '2026-2027',
        title: cleanTitle,
        id: generatedId,
        status: initialStatus,
        createdAt: today,
        approvedDate: initialStatus === 'Approved' ? today : undefined,
        approvedByL4: initialStatus === 'Approved' ? user.email : undefined,
        createdBy: user.id,
        createdEmail: user.email,
        createdRole: user.currentRole.roleName,
        isLocked: false,
        isRosterSubmitted: false,
        participants: []
      };

      importedIds.push(generatedId);
      newActivitiesToAdd.push(newAct);
      currentPool = [newAct, ...currentPool];
    });

    const successCount = newActivitiesToAdd.length;

    if (successCount > 0) {
      // 1. Cập nhật React state
      setActivities(prev => [...newActivitiesToAdd, ...prev]);

      // 2. Ghi tức thì vào localStorage để đảm bảo dữ liệu tồn tại
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
        let parsed = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(parsed)) parsed = [];
        const nextStored = [...newActivitiesToAdd, ...parsed.filter((p: any) => !importedIds.includes(p.id))];
        localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(nextStored));
      } catch (err) {
        console.warn('LocalStorage save error in bulkImportActivities:', err);
      }

      // 3. Đồng bộ hàng loạt lên Firestore
      batchSaveActivitiesToFirestore(newActivitiesToAdd).catch(err =>
        console.warn('Firestore bulk import activities error:', err)
      );

      // 4. Ghi nhật ký hệ thống
      addSystemActivityLog({
        category: 'ACTIVITY_WORKFLOW',
        actionTitle: 'Nạp hàng loạt hoạt động theo mẫu 15 mục',
        actionDetail: `Nạp thành công ${successCount} hoạt động mới từ file Excel chuẩn 15 mục đăng ký`,
        severity: 'info',
        performedBy: {
          userId: user.id,
          userName: user.fullName,
          userEmail: user.email,
          roleName: user.currentRole.roleName,
          roleLevel: user.currentRole.roleLevel
        },
        targetEntity: {
          type: 'ACTIVITY',
          id: importedIds.slice(0, 3).join(', ') + (importedIds.length > 3 ? '...' : ''),
          name: `Bộ ${successCount} hoạt động đăng ký mới (Mẫu 15 mục)`
        }
      });

      showToast(`Đã nạp thành công ${successCount} hoạt động theo mẫu 15 mục vào hệ thống!`, 'success');
    } else {
      showToast('Không có hoạt động nào hợp lệ để nạp!', 'error');
    }

    return { successCount, errorCount, importedIds };
  };

  const updateActivity = (id: string, updates: Partial<ActivitySubmission>) => {
    const target = activities.find(a => a.id === id);
    let updatedAct: ActivitySubmission | null = null;
    setActivities(prev => {
      const next = prev.map(act => {
        if (act.id !== id) return act;
        updatedAct = { ...act, ...updates };
        return updatedAct;
      });
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(next));
      return next;
    });
    if (updatedAct) saveActivityToFirestore(updatedAct).catch(err => console.warn('Firestore update activity error:', err));
    showToast(`Đã cập nhật thông tin hoạt động #${id}`, 'success');

    if (target) {
      addSystemActivityLog({
        category: 'ACTIVITY_WORKFLOW',
        actionTitle: 'Cập nhật thông tin hoạt động',
        actionDetail: `Chỉnh sửa nội dung kế hoạch hoạt động "${target.title}" (#${id})`,
        severity: 'info',
        performedBy: {
          userId: user.id,
          userName: user.fullName,
          userEmail: user.email,
          roleName: user.currentRole.roleName,
          roleLevel: user.currentRole.roleLevel
        },
        targetEntity: {
          type: 'ACTIVITY',
          id,
          name: target.title
        }
      });
    }
  };

  const updateActivityProof = (
    activityId: string,
    proofData: { proofImages?: string[]; attendanceSheetUrl?: string; actualPlanUrl?: string; proofArticleUrl?: string }
  ) => {
    const target = activities.find(a => a.id === activityId);
    let updatedAct: ActivitySubmission | null = null;
    setActivities(prev => {
      const next = prev.map(act => {
        if (act.id !== activityId) return act;
        updatedAct = { ...act, ...proofData };
        return updatedAct;
      });
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(next));
      return next;
    });
    if (updatedAct) saveActivityToFirestore(updatedAct).catch(err => console.warn('Firestore proof update error:', err));
    showToast(`Đã cập nhật hồ sơ minh chứng tổ chức cho hoạt động #${activityId}!`, 'success');

    if (target) {
      addSystemActivityLog({
        category: 'ACTIVITY_WORKFLOW',
        actionTitle: 'Cập nhật minh chứng tổ chức hoạt động',
        actionDetail: `Bổ sung tài liệu / hình ảnh minh chứng tổ chức hoạt động "${target.title}" (#${activityId})`,
        severity: 'info',
        performedBy: {
          userId: user.id,
          userName: user.fullName,
          userEmail: user.email,
          roleName: user.currentRole.roleName,
          roleLevel: user.currentRole.roleLevel
        },
        targetEntity: {
          type: 'ACTIVITY',
          id: activityId,
          name: target.title
        }
      });
    }
  };

  const sendActivityRosterReminder = (activityId: string) => {
    const nowStr = new Date().toISOString().split('T')[0];
    let updatedAct: ActivitySubmission | null = null;
    setActivities(prev => {
      const next = prev.map(act => {
        if (act.id !== activityId) return act;
        updatedAct = { ...act, deadlineReminderSentDate: nowStr };
        return updatedAct;
      });
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(next));
      return next;
    });
    if (updatedAct) saveActivityToFirestore(updatedAct).catch(err => console.warn('Firestore reminder update error:', err));
    const targetAct = activities.find(a => a.id === activityId);
    showToast(`Đã gửi email nhắc nhở đơn vị [${targetAct?.orgName}] nộp danh sách sinh viên tham gia!`, 'success');
  };

  const toggleLockActivity = (id: string) => {
    if (user.currentRole.roleLevel !== 4) {
      showToast('Chỉ tài khoản Cấp Trường mới có quyền khóa/mở khóa hoạt động!', 'error');
      return;
    }
    const targetAct = activities.find(a => a.id === id);
    const newLockState = !targetAct?.isLocked;
    let updatedAct: ActivitySubmission | null = null;

    setActivities(prev => {
      const next = prev.map(act => {
        if (act.id !== id) return act;
        updatedAct = { ...act, isLocked: newLockState };
        return updatedAct;
      });
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(next));
      return next;
    });

    if (updatedAct) saveActivityToFirestore(updatedAct).catch(err => console.warn('Firestore toggle lock error:', err));

    showToast(
      newLockState ? `Đã khóa sổ hoạt động #${id}` : `Đã mở khóa hoạt động #${id}`,
      newLockState ? 'info' : 'success'
    );

    if (targetAct) {
      addSystemActivityLog({
        category: 'SYSTEM_SECURITY',
        actionTitle: newLockState ? 'Khóa sổ hồ sơ hoạt động' : 'Mở khóa sổ hoạt động',
        actionDetail: `${newLockState ? 'Khóa bảo vệ dữ liệu điểm và danh sách' : 'Mở khóa cho phép nạp/sửa đổi'} của hoạt động "${targetAct.title}" (#${id})`,
        severity: newLockState ? 'warning' : 'info',
        performedBy: {
          userId: user.id,
          userName: user.fullName,
          userEmail: user.email,
          roleName: user.currentRole.roleName,
          roleLevel: user.currentRole.roleLevel
        },
        targetEntity: {
          type: 'ACTIVITY',
          id,
          name: targetAct.title
        },
        changes: [
          { field: 'isLocked', oldValue: String(targetAct.isLocked), newValue: String(newLockState) }
        ]
      });
    }
  };

  const reviewActivity = (id: string, decision: 'approve' | 'reject' | 'request_edit', feedbackNotes?: string) => {
    const currentLevel = user.currentRole.roleLevel;
    const nowStr = new Date().toISOString().split('T')[0];
    const act = activities.find(a => a.id === id);
    const actTitle = act?.title || id;
    const actScore = act?.totalLevelScore || 3;
    const orgName = act?.orgName || 'Đoàn - Hội';
    const drlText = act?.drlCriteriaText || 'Tiêu chí Rèn luyện';
    let updatedAct: ActivitySubmission | null = null;

    setActivities(prev => {
      const next: ActivitySubmission[] = prev.map(actItem => {
        if (actItem.id !== id) return actItem;

        let newItem: ActivitySubmission;
        if (decision === 'reject') {
          newItem = {
            ...actItem,
            status: 'Rejected' as const,
            feedbackNotes: feedbackNotes || 'Hoạt động không được phê duyệt.',
          };
        } else if (decision === 'request_edit') {
          newItem = {
            ...actItem,
            status: 'Request_Edit' as const,
            feedbackNotes: feedbackNotes || 'Cần bổ sung/hiệu chỉnh thêm thông tin kế hoạch và minh chứng.',
          };
        } else if (currentLevel === 3) {
          newItem = {
            ...actItem,
            status: 'Pending_L4' as const,
            approvedByL3: user.email,
            feedbackNotes: feedbackNotes || 'Đoàn Khoa đã thẩm tra hồ sơ, chuyển Đoàn trường phê duyệt.',
          };
        } else if (currentLevel === 4) {
          newItem = {
            ...actItem,
            status: 'Approved' as const,
            approvedByL4: user.email,
            approvedDate: nowStr,
            feedbackNotes: feedbackNotes || 'Đoàn trường đã phê duyệt chính thức.',
          };
        } else {
          newItem = actItem;
        }
        updatedAct = newItem;
        return newItem;
      });
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(next));
      return next;
    });

    if (updatedAct) saveActivityToFirestore(updatedAct).catch(err => console.warn('Firestore review activity error:', err));

    // Auto-log to System Activity Logs
    addSystemActivityLog({
      category: 'ACTIVITY_WORKFLOW',
      actionTitle: decision === 'approve'
        ? (currentLevel === 4 ? 'Phê duyệt kế hoạch hoạt động Cấp Trường' : 'Thẩm định hoạt động Cấp Khoa')
        : decision === 'reject'
        ? 'Từ chối kế hoạch hoạt động'
        : 'Yêu cầu chỉnh sửa kế hoạch hoạt động',
      actionDetail: `${decision === 'approve' ? 'Phê duyệt chính thức' : decision === 'reject' ? 'Từ chối' : 'Yêu cầu hiệu chỉnh'} hoạt động "${actTitle}" (#${id}) - Đơn vị: [${orgName}]`,
      severity: decision === 'approve' ? 'success' : decision === 'reject' ? 'danger' : 'warning',
      performedBy: {
        userId: user.id,
        userName: user.fullName,
        userEmail: user.email,
        roleName: user.currentRole.roleName,
        roleLevel: user.currentRole.roleLevel
      },
      targetEntity: {
        type: 'ACTIVITY',
        id,
        name: actTitle
      },
      changes: [
        { field: 'decision', newValue: decision },
        { field: 'feedbackNotes', newValue: feedbackNotes || 'Đã xử lý hồ sơ' }
      ]
    });

    if (decision === 'approve') {
      // Push notification cho sinh viên liên quan hoặc cá nhân sinh viên
      const participantIds = act?.participants?.map(p => p.studentId) || [];
      const managerId = act?.managerStudentId;
      const targetSet = new Set<string>();
      if (managerId) targetSet.add(managerId);
      participantIds.forEach(pid => targetSet.add(pid));

      if (targetSet.size === 0) {
        targetSet.add(user.studentId || '22130001');
      }

      targetSet.forEach(targetStdId => {
        sendStudentPushNotification(targetStdId, {
          type: 'activity_approved',
          title: `🎉 Hoạt Động Được Phê Duyệt: ${actTitle}`,
          message: `Hoạt động "${actTitle}" (${orgName}) đã được Đoàn trường phê duyệt chính thức! Điểm rèn luyện dự kiến: +${actScore}đ (${drlText}).`,
          activityId: id,
          activityTitle: actTitle,
          scoreDiff: actScore,
          linkTab: 'student-portal'
        });
      });
    } else {
      showToast(
        decision === 'request_edit'
          ? `Đã gửi yêu cầu chỉnh sửa cho hoạt động #${id}`
          : `Đã từ chối hoạt động #${id}`,
        'info'
      );
    }
  };

  const deleteActivity = (id: string, reason?: string): boolean => {
    const targetAct = activities.find(a => a.id === id);
    if (!targetAct) {
      showToast(`Không tìm thấy hoạt động #${id} để xóa!`, 'error');
      return false;
    }

    const currentLevel = user.currentRole.roleLevel;
    const currentOrgCode = user.currentRole.orgCode;
    const currentClassCode = user.currentRole.classCode || user.classCode;

    // Check permission
    if (currentLevel < 2) {
      showToast('Bạn không có quyền xóa hoạt động trên hệ thống!', 'error');
      return false;
    }

    if (targetAct.isLocked && currentLevel < 4) {
      showToast('Hoạt động này đã bị khóa sổ bởi Cấp Trường. Không thể xóa!', 'error');
      return false;
    }

    if (currentLevel === 3) {
      const isMyOrg = targetAct.orgCode === currentOrgCode;
      const isMyBranch = targetAct.branchClass && branchClasses.some(c => c.code === targetAct.branchClass && c.facultyCode === currentOrgCode);
      if (!isMyOrg && !isMyBranch) {
        showToast('Bạn chỉ có quyền xóa các hoạt động do Đoàn Khoa hoặc Chi đoàn trực thuộc Khoa mình tổ chức!', 'error');
        return false;
      }
    } else if (currentLevel === 2) {
      const isMyClass = currentClassCode && targetAct.branchClass === currentClassCode;
      const isMyOrg = targetAct.orgCode === currentOrgCode;
      if (!isMyClass && !isMyOrg) {
        showToast('Bạn chỉ có quyền xóa các hoạt động do chính Chi đoàn hoặc CLB mình tạo!', 'error');
        return false;
      }
    }

    // Nếu hoạt động đã nạp danh sách người tham gia và được duyệt, tính toán hoàn tác điểm an toàn
    const participantList = targetAct.participants || [];
    if (participantList.length > 0 && targetAct.status === 'Approved') {
      const scoreToRevert = targetAct.totalLevelScore || 0;
      setStudents(prevStudents => {
        const nextStudents = prevStudents.map(std => {
          const wasPart = participantList.some(p => p.studentId === std.studentId);
          if (!wasPart) return std;
          const updatedActScore = Math.max(0, (std.activityScore || 0) - scoreToRevert);
          const updatedCount = Math.max(0, (std.approvedActivitiesCount || 1) - 1);
          const totalScore = (std.bonusScore || 0) + (std.positionScore || 0) + (std.researchScore || 0) + updatedActScore;
          return {
            ...std,
            activityScore: updatedActScore,
            approvedActivitiesCount: updatedCount,
            totalScore,
            rankGrade: calculateRankGrade(totalScore, std.academicYearNumber),
            rankGeneral: calculateGeneralRank(totalScore)
          };
        });
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(nextStudents));
        batchSaveStudentsToFirestore(nextStudents).catch(err => {
          console.warn('Firestore revert student scores error:', err);
          firestoreRetryQueue.enqueue('BATCH_SAVE_STUDENTS', 'Cập nhật lại điểm sinh viên sau khi hủy hoạt động', nextStudents);
        });
        return nextStudents;
      });
    }

    // Soft delete: Đánh dấu deleted: true và isDeleted: true cùng lưu vết thời gian
    const nowIso = new Date().toISOString();
    const updatedAct: ActivitySubmission = {
      ...targetAct,
      deleted: true,
      isDeleted: true,
      deletedAt: nowIso,
      deletedBy: user.email,
      deletedReason: reason || 'Người dùng xóa hồ sơ qua giao diện quản trị'
    };

    setAllActivities(prev => {
      const next = prev.map(a => a.id === id ? updatedAct : a);
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(next));
      return next;
    });

    saveActivityToFirestore(updatedAct).catch(err => console.warn('Firestore soft delete activity error:', err));

    // Ghi nhận vết kiểm toán hệ thống Cấp 4 (Activity Log)
    addSystemActivityLog({
      category: 'ACTIVITY_WORKFLOW',
      actionTitle: 'Xóa mềm hồ sơ hoạt động Đoàn - Hội',
      actionDetail: `Đã đưa vào thùng rác hoạt động "${targetAct.title}" (#${id}) thuộc đơn vị [${targetAct.orgName || targetAct.orgCode}]${reason ? `. Lý do: ${reason}` : ''}`,
      severity: 'warning',
      performedBy: {
        userId: user.id,
        userName: user.fullName,
        userEmail: user.email,
        roleName: user.currentRole.roleName,
        roleLevel: user.currentRole.roleLevel
      },
      targetEntity: {
        type: 'ACTIVITY',
        id,
        name: targetAct.title
      },
      changes: [
        { field: 'deleted', oldValue: 'false', newValue: 'true' },
        { field: 'isDeleted', oldValue: 'false', newValue: 'true' },
        { field: 'deletedReason', newValue: reason || 'Đưa vào Thùng rác' }
      ]
    });

    showToast(`Đã chuyển hoạt động "${targetAct.title}" (#${id}) vào thùng rác an toàn!`, 'info');
    return true;
  };

  // Khôi phục hoạt động đã xóa mềm (Cấp 4)
  const restoreActivity = async (id: string): Promise<boolean> => {
    if (user.currentRole.roleLevel < 4) {
      showToast('Chỉ Quản trị viên Cấp Trường (Cấp 4) mới có quyền khôi phục dữ liệu đã xóa!', 'error');
      return false;
    }
    const targetAct = allActivities.find(a => a.id === id);
    if (!targetAct) {
      showToast(`Không tìm thấy hoạt động #${id} để khôi phục!`, 'error');
      return false;
    }

    const restoredAct: ActivitySubmission = {
      ...targetAct,
      deleted: false,
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined,
      deletedReason: undefined
    };

    const participantList = targetAct.participants || [];
    if (participantList.length > 0 && targetAct.status === 'Approved') {
      const scoreToAdd = targetAct.totalLevelScore || 0;
      setStudents(prevStudents => {
        const nextStudents = prevStudents.map(std => {
          const wasPart = participantList.some(p => p.studentId === std.studentId);
          if (!wasPart) return std;
          const updatedActScore = Math.max(0, (std.activityScore || 0) + scoreToAdd);
          const updatedCount = (std.approvedActivitiesCount || 0) + 1;
          const totalScore = Math.max(0, (std.bonusScore || 0) + (std.positionScore || 0) + (std.researchScore || 0) + updatedActScore);
          return {
            ...std,
            activityScore: updatedActScore,
            approvedActivitiesCount: updatedCount,
            totalScore,
            rankGrade: calculateRankGrade(totalScore, std.academicYearNumber),
            rankGeneral: calculateGeneralRank(totalScore)
          };
        });
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(nextStudents));
        batchSaveStudentsToFirestore(nextStudents).catch(err => {
          console.warn('Firestore restore student scores error:', err);
          firestoreRetryQueue.enqueue('BATCH_SAVE_STUDENTS', 'Cập nhật lại điểm sinh viên sau khi khôi phục hoạt động', nextStudents);
        });
        return nextStudents;
      });
    }

    setAllActivities(prev => {
      const next = prev.map(a => a.id === id ? restoredAct : a);
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(next));
      return next;
    });

    await saveActivityToFirestore(restoredAct);

    addSystemActivityLog({
      category: 'ACTIVITY_WORKFLOW',
      actionTitle: 'Khôi phục hoạt động từ Thùng rác',
      actionDetail: `Đã khôi phục hoạt động "${targetAct.title}" (#${id})`,
      severity: 'info',
      performedBy: {
        userId: user.id,
        userName: user.fullName,
        userEmail: user.email,
        roleName: user.currentRole.roleName,
        roleLevel: user.currentRole.roleLevel
      },
      targetEntity: {
        type: 'ACTIVITY',
        id,
        name: targetAct.title
      }
    });

    showToast(`Đã khôi phục thành công hoạt động "${targetAct.title}" (#${id})!`, 'success');
    return true;
  };

  // Xóa vĩnh viễn hoạt động khỏi Firestore và bộ nhớ (Cấp 4)
  const permanentDeleteActivity = async (id: string): Promise<boolean> => {
    if (user.currentRole.roleLevel < 4) {
      showToast('Chỉ Quản trị viên Cấp Trường (Cấp 4) mới có quyền xóa vĩnh viễn!', 'error');
      return false;
    }
    const targetAct = allActivities.find(a => a.id === id);
    try {
      await hardDeleteActivityFromFirestore(id);
      setAllActivities(prev => {
        const next = prev.filter(a => a.id !== id);
        localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(next));
        return next;
      });
      showToast(`Đã xóa vĩnh viễn hoạt động "${targetAct?.title || id}"!`, 'success');
      return true;
    } catch (err: any) {
      showToast(`Lỗi xóa vĩnh viễn hoạt động: ${err?.message || 'Không thể xóa'}`, 'error');
      return false;
    }

    addSystemActivityLog({
      category: 'ACTIVITY_WORKFLOW',
      actionTitle: 'Xóa vĩnh viễn hoạt động (Hard Delete)',
      actionDetail: `Đã xóa vĩnh viễn hoạt động "${targetAct?.title || id}" khỏi hệ thống`,
      severity: 'danger',
      performedBy: {
        userId: user.id,
        userName: user.fullName,
        userEmail: user.email,
        roleName: user.currentRole.roleName,
        roleLevel: user.currentRole.roleLevel
      },
      targetEntity: {
        type: 'ACTIVITY',
        id,
        name: targetAct?.title || id
      }
    });

    showToast(`Đã xóa vĩnh viễn hoạt động #${id} khỏi hệ thống!`, 'info');
    return true;
  };

  const deleteBatchActivities = (ids: string[], reason?: string): boolean => {
    if (!ids.length) {
      showToast('Chưa chọn hoạt động nào để xóa!', 'warning');
      return false;
    }

    let deletedCount = 0;
    const deletedTitles: string[] = [];

    ids.forEach(id => {
      const res = deleteActivity(id, reason || 'Xóa hàng loạt');
      if (res) {
        deletedCount++;
        const target = activities.find(a => a.id === id);
        if (target) deletedTitles.push(target.title);
      }
    });

    if (deletedCount > 0) {
      showToast(`Đã xóa thành công ${deletedCount} hoạt động và đồng bộ lưu trữ!`, 'success');
      return true;
    }
    return false;
  };

  // Upload Excel Participants & Re-eval
  const uploadActivityParticipants = (
    activityId: string,
    rawParticipants: { studentId: string; fullName: string; role: ParticipantRoleType; classCode?: string }[]
  ) => {
    const targetActivity = activities.find(a => a.id === activityId);
    if (!targetActivity) throw new Error('Không tìm thấy hoạt động');

    if (targetActivity.isLocked) {
      throw new Error('Hoạt động này đã bị khóa sổ bởi Cấp Trường. Không thể nạp hoặc sửa đổi danh sách.');
    }

    // Tự động kiểm tra trùng lặp bản ghi trong cùng một hoạt động (Yêu cầu 3)
    const uniqueParticipantsMap = new Map<string, typeof rawParticipants[0]>();
    rawParticipants.forEach(p => {
      const cleanId = p.studentId.trim();
      if (cleanId && !uniqueParticipantsMap.has(cleanId)) {
        uniqueParticipantsMap.set(cleanId, p);
      }
    });
    const uniqueParticipants = Array.from(uniqueParticipantsMap.values());
    const totalCount = uniqueParticipants.length;

    // Ràng buộc số lượng Ban tổ chức và Cộng tác viên theo Cấp chương trình
    const effectiveLevel = targetActivity.programLevel || 1;
    const quota = programPersonnelQuotas.find(q => q.level === effectiveLevel) || DEFAULT_PROGRAM_PERSONNEL_QUOTAS.find(q => q.level === effectiveLevel) || {
      level: effectiveLevel,
      levelName: `Chương trình Cấp ${effectiveLevel}`,
      maxBtc: effectiveLevel === 1 ? 5 : effectiveLevel === 2 ? 10 : effectiveLevel === 3 ? 15 : 20,
      maxCtv: effectiveLevel === 1 ? 10 : effectiveLevel === 2 ? 20 : effectiveLevel === 3 ? 30 : 40,
    };

    const btcCount = uniqueParticipants.filter(p => p.role === 'Ban Tổ chức').length;
    const ctvCount = uniqueParticipants.filter(p => p.role === 'Cộng tác viên').length;

    if (btcCount > quota.maxBtc || ctvCount > quota.maxCtv) {
      const violations: string[] = [];
      if (btcCount > quota.maxBtc) {
        violations.push(`Ban tổ chức có ${btcCount} người (vượt quá giới hạn tối đa ${quota.maxBtc} người)`);
      }
      if (ctvCount > quota.maxCtv) {
        violations.push(`Cộng tác viên có ${ctvCount} người (vượt quá giới hạn tối đa ${quota.maxCtv} người)`);
      }
      throw new Error(`Ràng buộc nhân sự cho ${quota.levelName} không hợp lệ: ${violations.join(', ')}. Vui lòng điều chỉnh lại danh sách theo yêu cầu ràng buộc trước khi nạp dữ liệu!`);
    }

    const { totalScore, programLevel, participantPoints } = calculateProgramLevelScore(
      targetActivity.scalePoints,
      totalCount,
      targetActivity.hostLevelPoints,
      { orgCode: targetActivity.orgCode, orgName: targetActivity.orgName }
    );

    const nowStr = new Date().toISOString().split('T')[0];

    const updatedEntries: ActivityParticipantEntry[] = uniqueParticipants.map(p => {
      const pts = getPointsForRole(p.role, programLevel);
      return {
        studentId: p.studentId.trim(),
        fullName: p.fullName.trim(),
        classCode: p.classCode?.trim() || targetActivity.branchClass || 'DH22IT01',
        facultyCode: targetActivity.orgCode,
        role: p.role,
        pointsAwarded: pts,
        recordedAt: nowStr
      };
    });

    const updatedActivities = activities.map(act => {
      if (act.id !== activityId) return act;
      return {
        ...act,
        officialParticipantCount: totalCount,
        participantScorePoints: participantPoints,
        totalLevelScore: totalScore,
        programLevel,
        isRosterSubmitted: true,
        participants: updatedEntries
      };
    });

    setActivities(updatedActivities);

    // Auto-update student points and ranks
    setStudents(prevStudents => {
      const nextStudents = [...prevStudents];

      rawParticipants.forEach(rawP => {
        const existingStudentIndex = nextStudents.findIndex(s => s.studentId === rawP.studentId);
        if (existingStudentIndex === -1) {
          nextStudents.push({
            id: `std_auto_${rawP.studentId}`,
            studentId: rawP.studentId,
            fullName: rawP.fullName,
            classCode: rawP.classCode || targetActivity.branchClass || 'DH22IT01',
            facultyCode: targetActivity.orgCode || 'CNTT',
            membershipType: 'DOAN_VIEN',
            academicYearNumber: rawP.studentId.startsWith('24') || rawP.studentId.startsWith('25') ? 1 : 2,
            bonusScore: 0,
            positionScore: 0,
            researchScore: 0,
            activityScore: 0,
            totalScore: 0,
            rankGrade: 'Không hoàn thành nhiệm vụ',
            rankGeneral: 'Yếu',
            isSv5tEligible: false,
            sv5tCriteriaAchieved: {},
            approvedActivitiesCount: 0
          });
        }
      });

      return nextStudents.map(student => {
        let studentActPoints = 0;
        let actCount = 0;

        updatedActivities.forEach(act => {
          if (act.status === 'Approved') {
            const p = act.participants.find(part => part.studentId === student.studentId);
            if (p) {
              studentActPoints += p.pointsAwarded;
              actCount++;
            }
          }
        });

        const finalActScore = studentActPoints;
        const finalCount = actCount;

        const totalScore = Math.max(0, student.bonusScore + student.positionScore + student.researchScore + finalActScore);
        const rankGrade = calculateRankGrade(totalScore, student.academicYearNumber);
        const rankGeneral = calculateGeneralRank(totalScore);
        const autoSv5t = computeAutoSv5t(student, updatedActivities, selfProofs);
        const isSv5tEligible = checkSv5tEligibility(autoSv5t).isEligible;

        return {
          ...student,
          activityScore: finalActScore,
          approvedActivitiesCount: finalCount,
          totalScore,
          rankGrade,
          rankGeneral,
          sv5tCriteriaAchieved: autoSv5t,
          isSv5tEligible
        };
      });
    });

    // Gửi push notification cho các sinh viên được ghi nhận điểm qua hoạt động
    updatedEntries.forEach(entry => {
      sendStudentPushNotification(entry.studentId, {
        type: 'score_updated',
        title: '🎖️ Ghi Nhận Điểm Hoạt Động',
        message: `Bạn vừa được ghi nhận tham gia hoạt động "${targetActivity.title}" với vai trò ${entry.role}. Điểm rèn luyện đã được cập nhật (+${entry.pointsAwarded}đ)!`,
        scoreDiff: entry.pointsAwarded,
        activityId: targetActivity.id,
        activityTitle: targetActivity.title,
        linkTab: 'student-portal'
      });
    });

    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(updatedActivities));

    // Ghi nhật ký hệ thống Cấp 4 (Activity Log)
    addSystemActivityLog({
      category: 'ACTIVITY_WORKFLOW',
      actionTitle: 'Nạp danh sách sinh viên tham gia hoạt động',
      actionDetail: `Nạp danh sách ${totalCount} sinh viên tham gia hoạt động "${targetActivity.title}" (#${activityId}) - Đơn vị: [${targetActivity.orgName}]`,
      severity: 'info',
      performedBy: {
        userId: user.id,
        userName: user.fullName,
        userEmail: user.email,
        roleName: user.currentRole.roleName,
        roleLevel: user.currentRole.roleLevel
      },
      targetEntity: {
        type: 'ACTIVITY',
        id: activityId,
        name: targetActivity.title
      },
      changes: [
        { field: 'officialParticipantCount', oldValue: String(targetActivity.officialParticipantCount || 0), newValue: String(totalCount) },
        { field: 'programLevel', oldValue: `Cấp ${targetActivity.programLevel}`, newValue: `Cấp ${programLevel}` },
        { field: 'totalLevelScore', oldValue: `${targetActivity.totalLevelScore}đ`, newValue: `${totalScore}đ` }
      ]
    });

    const updatedTargetAct = updatedActivities.find(a => a.id === activityId);
    if (updatedTargetAct) {
      saveActivityToFirestore(updatedTargetAct).catch(err => console.warn('Firestore activity roster upload error:', err));
    }
    batchSaveStudentsToFirestore(students).catch(err => {
      console.warn('Firestore student roster upload error:', err);
      firestoreRetryQueue.enqueue('BATCH_SAVE_STUDENTS', `Cập nhật danh sách ${students.length} sinh viên từ file Excel điểm`, students);
    });

    showToast(`Đã đối soát & cập nhật ${totalCount} sinh viên qua file Excel!`, 'success');
    return { successCount: totalCount, newParticipantCount: totalCount };
  };

  // Record Student Data Audit Trail (Ghi vết chi tiết trạng thái trước và sau khi thay đổi dữ liệu Đoàn viên vào collection 'audit_logs')
  const recordStudentAuditLog = React.useCallback((
    actionType: string,
    actionTitle: string,
    beforeState: Partial<StudentScoreRecord> | null,
    afterState: Partial<StudentScoreRecord> | null,
    reason?: string,
    studentMeta?: { studentId?: string; studentName?: string; classCode?: string; facultyCode?: string }
  ) => {
    const studentId = studentMeta?.studentId || afterState?.studentId || beforeState?.studentId || 'UNKNOWN';
    const studentName = studentMeta?.studentName || afterState?.fullName || beforeState?.fullName || 'Chưa xác định';
    const classCode = studentMeta?.classCode || afterState?.classCode || beforeState?.classCode || '';
    const facultyCode = studentMeta?.facultyCode || afterState?.facultyCode || beforeState?.facultyCode || '';

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestampStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const beforeObj = beforeState ? JSON.parse(JSON.stringify(beforeState)) : null;
    const afterObj = afterState ? JSON.parse(JSON.stringify(afterState)) : null;
    const changedFields = computeStudentChangedFields(beforeObj, afterObj);

    const logEntry: StudentAuditLog = {
      id: `audit_std_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: timestampStr,
      studentId,
      studentName,
      classCode,
      facultyCode,
      actionType,
      actionTitle,
      performedBy: {
        userId: user?.id || 'usr_current',
        userName: user?.fullName || user?.email || 'NguoiDung',
        userEmail: user?.email || 'user@system',
        roleName: user?.currentRole?.roleName || 'Cán bộ',
        roleLevel: user?.currentRole?.roleLevel || 1,
        orgCode: user?.currentRole?.orgCode
      },
      beforeState: beforeObj,
      afterState: afterObj,
      previousData: beforeObj,
      newData: afterObj,
      changedFields,
      reason: reason || 'Cập nhật thay đổi dữ liệu hồ sơ Đoàn viên / Sinh viên',
      ipAddress: '172.16.8.24 (Mạng Nội Bộ NLU)'
    };

    setStudentAuditLogs(prev => [logEntry, ...prev]);
    try {
      const storedStr = localStorage.getItem(STORAGE_KEYS.STUDENT_AUDIT_LOGS);
      const stored = storedStr ? JSON.parse(storedStr) : [];
      safeLocalStorageSetItem(STORAGE_KEYS.STUDENT_AUDIT_LOGS, JSON.stringify([logEntry, ...stored].slice(0, 100)));
    } catch (e) {
      console.warn('LocalStorage save student audit log error:', e);
    }

    saveStudentAuditLogToFirestore(logEntry).catch(err => {
      console.warn('Firestore save student audit log error:', err);
    });
  }, [user]);

  // Thêm mới sinh viên đơn lẻ (Liên kết trực tiếp Cổng SV & SV5T)
  const addStudent = (studentData: {
    studentId: string;
    fullName: string;
    classCode: string;
    facultyCode: string;
    clubCodes?: string[];
    clubCode?: string;
    clubName?: string;
    clubCategory?: ClubCategory;
    membershipType: StudentMembership;
    academicYearNumber: number;
    activityScore?: number;
    bonusScore?: number;
    positionScore?: number;
    researchScore?: number;
  }) => {
    const cleanId = studentData.studentId.trim().toUpperCase();
    const val = validateStudentData({ ...studentData, studentId: cleanId }, allStudents, true);
    if (!val.isValid) {
      showToast(val.errors.join(' | '), 'error');
      return false;
    }

    const activityScore = Number(studentData.activityScore) || 0;
    const bonusScore = Number(studentData.bonusScore) || 0;
    const positionScore = Number(studentData.positionScore) || 0;
    const researchScore = Number(studentData.researchScore) || 0;
    const totalScore = activityScore + bonusScore + positionScore + researchScore;
    const rankGrade = calculateRankGrade(totalScore, studentData.academicYearNumber);
    const rankGeneral = calculateGeneralRank(totalScore);

    const primaryClubCode = (studentData.clubCodes && studentData.clubCodes[0]) || undefined;
    const primaryOrg = primaryClubCode ? organizations.find(o => o.code === primaryClubCode) : undefined;
    const primaryCategory = primaryOrg ? getClubCategory(primaryOrg).category : undefined;

    const initialRecord: StudentScoreRecord = {
      id: `std_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentId: cleanId,
      fullName: studentData.fullName.trim(),
      classCode: studentData.classCode.trim(),
      facultyCode: studentData.facultyCode.trim(),
      clubCodes: studentData.clubCodes || [],
      clubCode: primaryClubCode,
      clubName: primaryOrg?.name,
      clubCategory: primaryCategory,
      membershipType: studentData.membershipType,
      academicYearNumber: studentData.academicYearNumber,
      activityScore,
      bonusScore,
      positionScore,
      researchScore,
      totalScore,
      rankGrade,
      rankGeneral,
      isSv5tEligible: false,
      sv5tCriteriaAchieved: {},
      approvedActivitiesCount: 0,
      deleted: false,
      isDeleted: false,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: user?.email || 'system'
    };

    const autoSv5t = computeAutoSv5t(initialRecord, activities, selfProofs);
    const { isEligible } = checkSv5tEligibility(autoSv5t);
    initialRecord.sv5tCriteriaAchieved = autoSv5t;
    initialRecord.isSv5tEligible = isEligible;

    setAllStudents(prev => {
      const filtered = prev.filter(s => s.studentId.trim().toLowerCase() !== cleanId.toLowerCase());
      const next = [initialRecord, ...filtered];
      try {
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save added student to localStorage:', e);
      }
      return next;
    });

    saveStudentToFirestore(initialRecord).catch(err => {
      console.warn('Firestore add student error:', err);
      firestoreRetryQueue.enqueue('SAVE_STUDENT', `Thêm sinh viên "${initialRecord.fullName}" (${cleanId})`, initialRecord, { docId: initialRecord.studentId, collectionName: 'students' });
    });

    recordStudentAuditLog(
      'ADD_STUDENT',
      `Thêm mới hồ sơ Đoàn viên/Sinh viên [${initialRecord.fullName}]`,
      null,
      initialRecord,
      'Thêm mới sinh viên vào danh mục hệ thống'
    );

    showToast(`Đã thêm mới sinh viên [${initialRecord.fullName}] (${cleanId}) thành công!`, 'success');
    return true;
  };

  // Xóa một sinh viên khỏi danh mục (Lưu tức thời & Ghi vết kiểm toán Cấp 4)
  const deleteStudent = (studentId: string, reason?: string) => {
    const target = students.find(s => s.studentId === studentId);
    if (!target) {
      showToast(`Không tìm thấy sinh viên MSSV ${studentId}!`, 'error');
      return;
    }

    // Soft-delete sinh viên: Đánh dấu deleted: true và isDeleted: true
    const nowIso = new Date().toISOString();
    const updatedTarget: StudentScoreRecord = {
      ...target,
      deleted: true,
      isDeleted: true,
      deletedAt: nowIso,
      deletedBy: user.email,
      deletedReason: reason || 'Xóa qua giao diện Sổ Điểm / Danh mục Sinh Viên'
    };

    setAllStudents(prev => {
      const next = prev.map(s => s.studentId === studentId ? updatedTarget : s);
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(next));
      return next;
    });

    saveStudentToFirestore(updatedTarget).catch(err => console.warn('Firestore soft-delete student error:', err));

    if (selectedPortalStudentId === studentId) {
      setSelectedPortalStudentId(null);
    }

    recordStudentAuditLog(
      'DELETE_STUDENT',
      `Xóa/Ẩn hồ sơ Đoàn viên [${target.fullName}] (${studentId})`,
      target,
      updatedTarget,
      reason || 'Xóa/Xóa mềm hồ sơ sinh viên'
    );

    // Ghi nhận nhật ký hệ thống Cấp 4 (Activity Log)
    addSystemActivityLog({
      category: 'ACCOUNT_PERMISSION',
      actionTitle: 'Xóa mềm hồ sơ sinh viên',
      actionDetail: `Đã đưa vào thùng rác sinh viên [${target.fullName}] (MSSV: ${studentId}, Lớp: ${target.classCode}, Khoa: ${target.facultyCode})${reason ? `. Lý do: ${reason}` : ''}`,
      severity: 'warning',
      performedBy: {
        userId: user.id,
        userName: user.fullName,
        userEmail: user.email,
        roleName: user.currentRole.roleName,
        roleLevel: user.currentRole.roleLevel
      },
      targetEntity: {
        type: 'STUDENT',
        id: studentId,
        name: target.fullName
      },
      changes: [
        { field: 'deleted', oldValue: 'false', newValue: 'true' },
        { field: 'isDeleted', oldValue: 'false', newValue: 'true' },
        { field: 'deletionReason', newValue: reason || 'Đưa vào Thùng rác' }
      ]
    });

    showToast(`Đã chuyển sinh viên [${target.fullName}] (${studentId}) vào thùng rác an toàn!`, 'info');
  };

  // Khôi phục sinh viên đã xóa mềm (Cấp 4)
  const restoreStudent = async (studentId: string): Promise<boolean> => {
    if (user.currentRole.roleLevel < 4) {
      showToast('Chỉ Quản trị viên Cấp Trường (Cấp 4) mới có quyền khôi phục dữ liệu!', 'error');
      return false;
    }
    const target = allStudents.find(s => s.studentId === studentId);
    if (!target) {
      showToast(`Không tìm thấy sinh viên MSSV ${studentId}!`, 'error');
      return false;
    }

    const restored: StudentScoreRecord = {
      ...target,
      deleted: false,
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined,
      deletedReason: undefined
    };

    setAllStudents(prev => {
      const next = prev.map(s => s.studentId === studentId ? restored : s);
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(next));
      return next;
    });

    await saveStudentToFirestore(restored);

    recordStudentAuditLog(
      'RESTORE_STUDENT',
      `Khôi phục hồ sơ Đoàn viên từ Thùng rác [${target.fullName}] (${studentId})`,
      target,
      restored,
      'Khôi phục hồ sơ sinh viên từ Thùng rác'
    );

    addSystemActivityLog({
      category: 'ACCOUNT_PERMISSION',
      actionTitle: 'Khôi phục hồ sơ sinh viên từ Thùng rác',
      actionDetail: `Đã khôi phục sinh viên [${target.fullName}] (${studentId})`,
      severity: 'info',
      performedBy: {
        userId: user.id,
        userName: user.fullName,
        userEmail: user.email,
        roleName: user.currentRole.roleName,
        roleLevel: user.currentRole.roleLevel
      },
      targetEntity: {
        type: 'STUDENT',
        id: studentId,
        name: target.fullName
      }
    });

    showToast(`Đã khôi phục thành công sinh viên [${target.fullName}] (${studentId})!`, 'success');
    return true;
  };

  // Xóa vĩnh viễn sinh viên khỏi hệ thống (Cấp 4)
  const permanentDeleteStudent = async (studentId: string): Promise<boolean> => {
    if (user.currentRole.roleLevel < 4) {
      showToast('Chỉ Quản trị viên Cấp Trường (Cấp 4) mới có quyền xóa vĩnh viễn!', 'error');
      return false;
    }
    const target = allStudents.find(s => s.studentId === studentId);
    setAllStudents(prev => {
      const next = prev.filter(s => s.studentId !== studentId);
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(next));
      return next;
    });

    await deleteStudentFromFirestore(studentId);

    addSystemActivityLog({
      category: 'ACCOUNT_PERMISSION',
      actionTitle: 'Xóa vĩnh viễn sinh viên (Hard Delete)',
      actionDetail: `Đã xóa vĩnh viễn sinh viên [${target?.fullName || studentId}] (${studentId}) khỏi cơ sở dữ liệu`,
      severity: 'danger',
      performedBy: {
        userId: user.id,
        userName: user.fullName,
        userEmail: user.email,
        roleName: user.currentRole.roleName,
        roleLevel: user.currentRole.roleLevel
      },
      targetEntity: {
        type: 'STUDENT',
        id: studentId,
        name: target?.fullName || studentId
      }
    });

    showToast(`Đã xóa vĩnh viễn sinh viên MSSV ${studentId}!`, 'info');
    return true;
  };

  // Xóa hàng loạt sinh viên (Lưu tức thời & Ghi vết kiểm toán Cấp 4)
  const deleteBatchStudents = (studentIds: string[], reason?: string) => {
    if (!studentIds.length) return;
    const removedTargets = students.filter(s => studentIds.includes(s.studentId));
    const nextStudents = students.filter(s => !studentIds.includes(s.studentId));
    setStudents(nextStudents);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(nextStudents));
    batchDeleteStudentsFromFirestore(studentIds).catch(err => console.warn('Firestore batch delete students error:', err));

    if (selectedPortalStudentId && studentIds.includes(selectedPortalStudentId)) {
      setSelectedPortalStudentId(null);
    }

    // Ghi nhận nhật ký hệ thống Cấp 4 (Activity Log)
    addSystemActivityLog({
      category: 'ACCOUNT_PERMISSION',
      actionTitle: 'Xóa hàng loạt sinh viên',
      actionDetail: `Đã xóa ${removedTargets.length} sinh viên khỏi danh mục hồ sơ hệ thống${reason ? `. Lý do: ${reason}` : ''}`,
      severity: 'danger',
      performedBy: {
        userId: user.id,
        userName: user.fullName,
        userEmail: user.email,
        roleName: user.currentRole.roleName,
        roleLevel: user.currentRole.roleLevel
      },
      targetEntity: {
        type: 'STUDENT',
        id: `batch_${removedTargets.length}_students`,
        name: `${removedTargets.length} sinh viên`
      },
      changes: [
        { field: 'batchDeleteCount', newValue: `${removedTargets.length} sinh viên` },
        { field: 'deletedStudentIds', newValue: studentIds.slice(0, 5).join(', ') + (studentIds.length > 5 ? '...' : '') },
        { field: 'deletionReason', newValue: reason || 'Xóa hàng loạt qua giao diện Sổ Điểm' }
      ]
    });

    showToast(`Đã xóa ${studentIds.length} sinh viên khỏi danh mục và lưu trữ hệ thống!`, 'success');
  };

  // Student Bulk Import (Module 3)
  // Student Bulk Import (Module 3)
  const bulkImportStudents = (
    importedStudents: {
      studentId: string;
      fullName: string;
      classCode: string;
      facultyCode: string;
      clubCodes?: string[];
      membershipType?: StudentMembership;
      academicYearNumber?: number;
    }[],
    updateExisting: boolean = false
  ) => {
    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const toSave: StudentScoreRecord[] = [];

    const userOrgCode = user?.currentRole?.orgCode || 'CNTT';
    const userClassCode = user?.currentRole?.classCode || '';

    const beforeMap = new Map<string, StudentScoreRecord>();
    allStudents.forEach(s => beforeMap.set(s.studentId.trim().toLowerCase(), JSON.parse(JSON.stringify(s))));

    const existingMap = new Map(allStudents.map(s => [s.studentId.trim().toLowerCase(), s]));

    importedStudents.forEach(item => {
      if (!item.studentId || !item.fullName) {
        errorCount++;
        return;
      }
      const cleanId = String(item.studentId).trim();
      if (!cleanId) {
        errorCount++;
        return;
      }
      const existing = existingMap.get(cleanId.toLowerCase());

      const userLevel = user?.currentRole?.roleLevel || 1;
      const userOrgCode = user?.currentRole?.orgCode || 'CNTT';
      const userClassCode = user?.currentRole?.classCode || '';

      const fallbackFaculty = userOrgCode || 'CNTT';
      const fallbackClass = userClassCode || 'DH24IT01';

      let rawFaculty = (item.facultyCode && item.facultyCode.trim()) || existing?.facultyCode || fallbackFaculty;
      let rawClass = (item.classCode && item.classCode.trim()) || existing?.classCode || fallbackClass;

      const finalFacultyCode = (userLevel === 3 || userLevel === 2) ? (userOrgCode || rawFaculty) : rawFaculty;
      const finalClassCode = userLevel === 2 ? (userClassCode || rawClass) : rawClass;

      if (existing) {
        if (updateExisting) {
          const updated: StudentScoreRecord = {
            ...existing,
            fullName: item.fullName.trim() || existing.fullName,
            classCode: finalClassCode,
            facultyCode: finalFacultyCode,
            clubCodes: item.clubCodes !== undefined ? item.clubCodes : existing.clubCodes,
            membershipType: item.membershipType || existing.membershipType,
            deleted: false,
            isDeleted: false,
            version: (existing.version || 0) + 1,
            updatedAt: new Date().toISOString(),
            updatedBy: user?.email || 'system'
          };
          existingMap.set(cleanId.toLowerCase(), updated);
          toSave.push(updated);
          successCount++;
        } else {
          duplicateCount++;
        }
        return;
      }

      successCount++;
      const academicYearNumber =
        item.academicYearNumber || (cleanId.startsWith('24') || cleanId.startsWith('25') ? 1 : (cleanId.startsWith('23') ? 2 : 3));
      const totalScore = 0;
      const rankGrade = calculateRankGrade(0, academicYearNumber);
      const rankGeneral = calculateGeneralRank(0);

      const primaryClubCode = (item.clubCodes && item.clubCodes[0]) || undefined;
      const primaryOrg = primaryClubCode ? organizations.find(o => o.code === primaryClubCode) : undefined;
      const primaryCategory = primaryOrg ? getClubCategory(primaryOrg).category : undefined;

      const newRec: StudentScoreRecord = {
        id: `std_${Date.now()}_${Math.random().toString(36).substring(2, 6)}_${Math.floor(Math.random() * 1000)}`,
        studentId: cleanId,
        fullName: item.fullName.trim(),
        classCode: finalClassCode,
        facultyCode: finalFacultyCode,
        clubCodes: item.clubCodes || [],
        clubCode: primaryClubCode,
        clubName: primaryOrg?.name,
        clubCategory: primaryCategory,
        membershipType: item.membershipType || 'DOAN_VIEN',
        academicYearNumber,
        bonusScore: 0,
        positionScore: 0,
        researchScore: 0,
        activityScore: 0,
        totalScore,
        rankGrade,
        rankGeneral,
        isSv5tEligible: false,
        sv5tCriteriaAchieved: {},
        approvedActivitiesCount: 0,
        deleted: false,
        isDeleted: false,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || 'system'
      };

      const autoCriteria = computeAutoSv5t(newRec, activities, selfProofs);
      const { isEligible } = checkSv5tEligibility(autoCriteria);
      newRec.sv5tCriteriaAchieved = autoCriteria;
      newRec.isSv5tEligible = isEligible;

      existingMap.set(cleanId.toLowerCase(), newRec);
      toSave.push(newRec);
    });

    const nextAllStudents = Array.from(existingMap.values());
    setAllStudents(nextAllStudents);
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(nextAllStudents));
      createStudentBackupSnapshot('Nạp dữ liệu Excel hàng loạt');
    } catch (e) {
      console.warn('Failed to save imported students to localStorage:', e);
    }

    if (toSave.length > 0) {
      toSave.forEach(stdRec => {
        const beforeRec = beforeMap.get(stdRec.studentId.trim().toLowerCase()) || null;
        recordStudentAuditLog(
          beforeRec ? 'UPDATE_STUDENT' : 'IMPORT_STUDENT',
          beforeRec
            ? `Cập nhật thông tin Đoàn viên [${stdRec.fullName}] qua nhập Excel`
            : `Nhập mới Đoàn viên [${stdRec.fullName}] qua Excel`,
          beforeRec,
          stdRec,
          'Nhập danh mục sinh viên/Đoàn viên từ file Excel'
        );
      });

      batchSaveStudentsToFirestore(toSave)
        .then(() => {
          showToast(
            `Đã lưu đồng bộ thành công ${successCount} sinh viên lên Firestore (${duplicateCount} bỏ qua)!`,
            'success'
          );
        })
        .catch(err => {
          console.warn('Firestore bulk import students error:', err);
          firestoreRetryQueue.enqueue(
            'BATCH_SAVE_STUDENTS',
            `Đồng bộ ${toSave.length} sinh viên nạp từ Excel`,
            toSave
          );
          showToast('Lưu Firestore gặp lỗi kết nối. Dữ liệu đã lưu tạm vào Hàng Đợi Thử Lại (Retry-Queue) để tự động đồng bộ khi có mạng.', 'warning');
        });

      addSystemActivityLog({
        category: 'ACCOUNT_PERMISSION',
        actionTitle: 'Import danh sách sinh viên từ Excel',
        actionDetail: `Đã nạp thành công ${successCount} hồ sơ sinh viên vào hệ thống (${duplicateCount} trùng MSSV bỏ qua)`,
        severity: 'info',
        performedBy: {
          userId: user.id,
          userName: user.fullName,
          userEmail: user.email,
          roleName: user.currentRole.roleName,
          roleLevel: user.currentRole.roleLevel
        },
        targetEntity: {
          type: 'STUDENT',
          id: `import_${successCount}_students`,
          name: `${successCount} sinh viên`
        },
        changes: [
          { field: 'importedCount', newValue: `${successCount} sinh viên` },
          { field: 'skippedCount', newValue: `${duplicateCount} sinh viên` }
        ]
      });
    } else {
      showToast(`Không có bản ghi sinh viên mới nào được ghi nhận (${duplicateCount} trùng MSSV).`, 'info');
    }

    return { successCount, duplicateCount, errorCount };
  };

  const restoreSampleStudents = async () => {
    if (user.currentRole.roleLevel < 4) {
      showToast('Chỉ Quản trị viên Cấp 4 mới có quyền sử dụng công cụ khôi phục dữ liệu!', 'error');
      return;
    }
    if (import.meta.env.PROD) {
      showToast('Tính năng khôi phục dữ liệu mẫu đã bị vô hiệu hóa trên môi trường Production để bảo toàn dữ liệu thực.', 'error');
      return;
    }
    const confirmed = window.confirm(
      'CẢNH BÁO AN TOÀN:\nBạn đang yêu cầu nạp lại dữ liệu sinh viên mẫu.\nThao tác này chỉ chạy trong môi trường thử nghiệm.\nBạn có chắc chắn muốn tiếp tục?'
    );
    if (!confirmed) return;

    setStudents(INITIAL_STUDENTS);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    try {
      await batchSaveStudentsToFirestore(INITIAL_STUDENTS);
      showToast('Đã khôi phục thành công danh mục sinh viên mẫu!', 'success');
    } catch (err: any) {
      showToast(`Lỗi lưu sinh viên mẫu lên Firestore: ${err?.message || 'Lỗi'}`, 'error');
    }
  };

  // --------------------------------------------------------------------------
  // BẢO TOÀN DỮ LIỆU & KHÔI PHỤC COLLECTION SINH VIÊN TỪ BẢN SAO LƯU GẦN NHẤT
  // --------------------------------------------------------------------------
  interface StudentSnapshotRecord {
    id: string;
    timestamp: string;
    count: number;
    students: StudentScoreRecord[];
    source: string;
  }

  const [latestStudentBackupInfo, setLatestStudentBackupInfo] = useState<{
    id: string;
    timestamp: string;
    count: number;
    source: string;
  } | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS_SNAPSHOT);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return {
            id: parsed[0].id,
            timestamp: parsed[0].timestamp,
            count: parsed[0].count,
            source: parsed[0].source
          };
        }
      }
    } catch {}
    return {
      id: 'snap_initial',
      timestamp: 'Bản sao lưu chuẩn NLU',
      count: INITIAL_STUDENTS.length,
      source: 'Cơ sở dữ liệu mẫu chuẩn NLU 2026'
    };
  });

  // Tự động duy trì snapshot khi có dữ liệu sinh viên hợp lệ
  useEffect(() => {
    if (allStudents && allStudents.length > 0) {
      try {
        const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS_SNAPSHOT);
        const existing: StudentSnapshotRecord[] = raw ? JSON.parse(raw) : [];
        if (existing.length === 0) {
          const activeStds = allStudents.filter(s => !s.deleted && !s.isDeleted);
          const initialSnap: StudentSnapshotRecord = {
            id: `snap_${Date.now()}`,
            timestamp: new Date().toLocaleString('vi-VN'),
            count: activeStds.length,
            students: JSON.parse(JSON.stringify(allStudents)),
            source: 'Tự động sao lưu khởi tạo hệ thống'
          };
          localStorage.setItem(STORAGE_KEYS.STUDENTS_SNAPSHOT, JSON.stringify([initialSnap]));
          setLatestStudentBackupInfo({
            id: initialSnap.id,
            timestamp: initialSnap.timestamp,
            count: initialSnap.count,
            source: initialSnap.source
          });
        }
      } catch (e) {
        console.warn('Initial student snapshot sync error:', e);
      }
    }
  }, [allStudents.length]);

  // Tạo bản sao lưu tức thì của collection sinh viên
  const createStudentBackupSnapshot = (source: string = 'Sao lưu tức thì') => {
    const activeStds = allStudents.filter(s => !s.deleted && !s.isDeleted);
    const snapshot: StudentSnapshotRecord = {
      id: `snap_${Date.now()}`,
      timestamp: new Date().toLocaleString('vi-VN'),
      count: activeStds.length,
      students: JSON.parse(JSON.stringify(allStudents)),
      source
    };
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS_SNAPSHOT);
      const existing: StudentSnapshotRecord[] = raw ? JSON.parse(raw) : [];
      const updated = [snapshot, ...existing.filter(s => s.id !== snapshot.id)].slice(0, 5);
      localStorage.setItem(STORAGE_KEYS.STUDENTS_SNAPSHOT, JSON.stringify(updated));
      setLatestStudentBackupInfo({
        id: snapshot.id,
        timestamp: snapshot.timestamp,
        count: snapshot.count,
        source: snapshot.source
      });
      showToast(`Đã lưu an toàn snapshot sao lưu collection sinh viên (${activeStds.length} hồ sơ)!`, 'success');
    } catch (e) {
      console.warn('Failed to save student backup snapshot:', e);
    }
  };

  // Khôi phục từ bản sao lưu gần nhất
  const restoreStudentsFromLatestBackup = async (
    targetSnapshotId?: string
  ): Promise<{ success: boolean; restoredCount: number; message: string }> => {
    let targetStudents: StudentScoreRecord[] | null = null;
    let targetTimestamp = '';
    let targetCount = 0;

    // 1. Tìm trong snapshots đã lưu
    try {
      const rawSnapshots = localStorage.getItem(STORAGE_KEYS.STUDENTS_SNAPSHOT);
      if (rawSnapshots) {
        const snapshots: StudentSnapshotRecord[] = JSON.parse(rawSnapshots);
        if (snapshots.length > 0) {
          const selected = targetSnapshotId
            ? snapshots.find(s => s.id === targetSnapshotId) || snapshots[0]
            : snapshots[0];
          if (selected && Array.isArray(selected.students) && selected.students.length > 0) {
            targetStudents = selected.students;
            targetTimestamp = selected.timestamp;
            targetCount = selected.students.filter(s => !s.deleted && !s.isDeleted).length;
          }
        }
      }
    } catch (e) {
      console.warn('Error reading student snapshot:', e);
    }

    // 2. Tìm trong backup lịch sử hệ thống
    if (!targetStudents || targetStudents.length === 0) {
      try {
        const rawCached = localStorage.getItem(STORAGE_KEYS.STUDENTS);
        if (rawCached) {
          const parsed = JSON.parse(rawCached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            targetStudents = parsed;
            targetTimestamp = 'Bản lưu đệm cục bộ (LocalStorage)';
            targetCount = parsed.filter((s: any) => !s.deleted && !s.isDeleted).length;
          }
        }
      } catch (e) {}
    }

    // 3. Fallback danh mục chuẩn ban đầu
    if (!targetStudents || targetStudents.length === 0) {
      targetStudents = INITIAL_STUDENTS;
      targetTimestamp = 'Bản sao lưu mẫu chuẩn NLU Youth';
      targetCount = INITIAL_STUDENTS.length;
    }

    try {
      // Cập nhật State
      setAllStudents(targetStudents);
      const activeList = targetStudents.filter(s => !s.deleted && !s.isDeleted);
      setStudents(activeList);

      // Lưu LocalStorage
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(targetStudents));

      // Đồng bộ Cloud Firestore
      await batchSaveStudentsToFirestore(targetStudents);

      // Ghi nhật ký kiểm toán hệ thống
      addSystemActivityLog({
        category: 'SYSTEM_SECURITY',
        actionTitle: 'Khôi phục collection sinh viên từ bản sao lưu gần nhất',
        actionDetail: `Khôi phục thành công ${targetCount} hồ sơ sinh viên từ bản sao lưu [${targetTimestamp}] và đồng bộ lên Cloud Firestore.`,
        severity: 'success',
        performedBy: {
          userId: user.id || 'system',
          userName: user.fullName || 'Cán bộ quản trị',
          userEmail: user.email || 'admin@hcmuaf.edu.vn',
          roleName: user.currentRole?.roleName || 'Quản trị viên Cấp 4',
          roleLevel: user.currentRole?.roleLevel || 4
        }
      });

      showToast(`Đã khôi phục thành công ${targetCount} hồ sơ sinh viên từ bản sao lưu gần nhất [${targetTimestamp}]!`, 'success');

      return {
        success: true,
        restoredCount: targetCount,
        message: `Đã khôi phục thành công ${targetCount} hồ sơ sinh viên từ bản sao lưu [${targetTimestamp}] và đồng bộ lên Cloud Firestore.`
      };
    } catch (error: any) {
      console.error('Error during student restoration:', error);
      showToast(`Lỗi khi khôi phục sinh viên: ${error?.message || 'Không xác định'}`, 'error');
      return {
        success: false,
        restoredCount: 0,
        message: `Lỗi khôi phục: ${error?.message || 'Không xác định'}`
      };
    }
  };

  // Tự động kiểm tra tính toàn vẹn của collection sinh viên
  const checkStudentCollectionIntegrity = (): StudentCollectionIntegrityReport => {
    const cachedCount = latestStudentBackupInfo?.count;
    return validateStudentCollectionIntegrity(
      allStudents,
      organizations,
      branchClasses,
      cachedCount
    );
  };

  // Tự động bổ sung các mã lớp chưa đăng ký vào danh mục Lớp chính thức
  const autoFixUncatalogedClasses = (): {
    registeredCount: number;
    fixedStudentCount: number;
    message: string;
  } => {
    const knownCodes = new Set<string>();
    branchClasses.forEach(c => knownCodes.add(c.code.trim().toUpperCase()));
    BRANCH_CLASSES.forEach(c => knownCodes.add(c.code.trim().toUpperCase()));

    const uncatalogedMap = new Map<string, { facultyCode: string; count: number }>();
    const normalizedStudents = allStudents.map(std => {
      if (!std.classCode) return std;
      let cleanCls = std.classCode.trim().toUpperCase().replace(/\s+/g, '');
      const stdFac = (std.facultyCode || '').trim().toUpperCase();

      if (!knownCodes.has(cleanCls)) {
        const existing = uncatalogedMap.get(cleanCls) || { facultyCode: stdFac, count: 0 };
        existing.count++;
        if (!existing.facultyCode && stdFac) existing.facultyCode = stdFac;
        uncatalogedMap.set(cleanCls, existing);
      }

      if (cleanCls !== std.classCode) {
        return { ...std, classCode: cleanCls };
      }
      return std;
    });

    const newClassesToAdd: BranchClass[] = [];
    uncatalogedMap.forEach((meta, code) => {
      let fac = meta.facultyCode;
      if (!fac) {
        if (code.includes('IT')) fac = 'CNTT';
        else if (code.includes('TY')) fac = 'CNTY';
        else if (code.includes('KT')) fac = 'KT';
        else if (code.includes('SH')) fac = 'KHSH';
        else if (code.includes('CK')) fac = 'CKCN';
        else if (code.includes('HH') || code.includes('TP')) fac = 'CNHTP';
        else if (code.includes('LN')) fac = 'LN';
        else if (code.includes('MT')) fac = 'MTTN';
        else if (code.includes('SP')) fac = 'NNSP';
        else if (code.includes('NH')) fac = 'NH';
        else if (code.includes('DD') || code.includes('QL')) fac = 'QLDDBDS';
        else if (code.includes('TS')) fac = 'TS';
        else fac = 'CNTT';
      }

      let academicYear = '2024-2028';
      const matchYear = code.match(/DH(\d{2})/i);
      if (matchYear) {
        const startY = 2000 + parseInt(matchYear[1], 10);
        academicYear = `${startY}-${startY + 4}`;
      }

      newClassesToAdd.push({
        id: `cls_${code}`,
        code: code,
        name: `Chi đoàn ${code} (Danh mục NLU mới bổ sung)`,
        facultyCode: fac,
        academicYear
      });
    });

    if (newClassesToAdd.length > 0) {
      const mergedClasses = [...branchClasses, ...newClassesToAdd];
      setBranchClasses(mergedClasses);
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(mergedClasses));
    }

    const hasStudentChanges = normalizedStudents.some((s, i) => s.classCode !== allStudents[i]?.classCode);
    if (hasStudentChanges || newClassesToAdd.length > 0) {
      setAllStudents(normalizedStudents);
      setStudents(normalizedStudents.filter(s => !s.deleted && !s.isDeleted));
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(normalizedStudents));
      batchSaveStudentsToFirestore(normalizedStudents).catch(err => console.warn('Firestore update students error:', err));
    }

    addSystemActivityLog({
      category: 'ORGANIZATION_DATA',
      actionTitle: 'Tự động bổ sung mã lớp vào danh mục chính thức của Nhà trường',
      actionDetail: `Đã tự động bổ sung ${newClassesToAdd.length} mã lớp chưa đăng ký vào danh mục Lớp/Chi đoàn chính thức và chuẩn hóa dữ liệu sinh viên liên quan.`,
      severity: 'success',
      performedBy: {
        userId: user.id || 'system',
        userName: user.fullName || 'Cán bộ quản trị',
        userEmail: user.email || 'admin@hcmuaf.edu.vn',
        roleName: user.currentRole?.roleName || 'Quản trị viên Cấp 4',
        roleLevel: user.currentRole?.roleLevel || 4
      }
    });

    const msg = uncatalogedMap.size > 0
      ? `Đã tự động bổ sung ${newClassesToAdd.length} mã lớp vào danh mục lớp chính thức và chuẩn hóa dữ liệu sinh viên!`
      : 'Tất cả các mã lớp sinh viên hiện tại đã hoàn toàn khớp 100% với danh mục lớp chính thức của Nhà trường.';

    showToast(msg, 'success');

    return {
      registeredCount: newClassesToAdd.length,
      fixedStudentCount: uncatalogedMap.size,
      message: msg
    };
  };

  const checkInActivity = async (params: {
    activityId: string;
    studentId: string;
    role?: ParticipantRoleType;
    sessionId?: string;
    token?: string;
    operationId?: string;
    recordedByEmail?: string;
  }): Promise<{ success: boolean; message: string; record?: AttendanceRecord; isDuplicate?: boolean }> => {
    try {
      if (user.currentRole.roleLevel === 0 || !user.email) {
        return { success: false, message: "Bạn chưa đăng nhập hoặc không có quyền thực hiện chức năng này." };
      }

      let targetStudentId = params.studentId;
      let targetRecordedBy = user.email;

      if (user.currentRole.roleLevel === 1) {
        if (!user.studentId) {
          return { success: false, message: "Tài khoản của bạn chưa được liên kết với hồ sơ sinh viên chính thức nào." };
        }
        targetStudentId = user.studentId;
      }

      if (!params.activityId || !targetStudentId) {
        return { success: false, message: "Thiếu thông tin mã hoạt động hoặc mã số sinh viên." };
      }

      const student = allStudents.find(s => s.studentId === targetStudentId || s.id === targetStudentId);
      const act = activities.find(a => a.id === params.activityId);

      if (!student || student.deleted || student.isDeleted) {
        return { success: false, message: "Sinh viên với MSSV [" + targetStudentId + "] không tồn tại hoặc đã bị xóa khỏi hệ thống." };
      }
      if (!act || act.deleted || act.isDeleted) {
        return { success: false, message: "Hoạt động [" + params.activityId + "] không tồn tại hoặc đã bị xóa." };
      }
      if (act.status !== "Approved") {
        return { success: false, message: "Hoạt động [" + act.title + "] chưa được phê duyệt chính thức và không thể điểm danh." };
      }
      if (act.isLocked) {
        return { success: false, message: "Hoạt động [" + act.title + "] đã khóa điểm danh và hoàn tất báo cáo." };
      }

      const assignedRole: ParticipantRoleType = params.role || "Tham dự";
      const programLevel = act.programLevel || 1;
      const calculatedScore = getPointsForRole(assignedRole, programLevel);

      // Perform atomic, concurrent-safe transaction in Firestore
      const txResult = await performCheckInTransaction({
        activityId: params.activityId,
        studentId: student.studentId,
        role: assignedRole,
        token: params.token,
        sessionId: params.sessionId,
        recordedByEmail: targetRecordedBy,
        calculatedScore,
        user
      });

      if (!txResult.success) {
        return { success: false, message: txResult.message };
      }

      if (txResult.isDuplicate) {
        return {
          success: true,
          message: "Sinh viên " + student.fullName + " (" + student.studentId + ") đã được điểm danh trước đó cho hoạt động này!",
          record: txResult.record,
          isDuplicate: true
        };
      }

      // Synchronize in-memory React states immediately for real-time reactivity
      if (txResult.studentData) {
        setAllStudents(prev => prev.map(s => s.studentId === txResult.studentData!.studentId ? txResult.studentData! : s));
      }
      if (txResult.activityData) {
        setAllActivities(prev => prev.map(a => a.id === txResult.activityData!.id ? txResult.activityData! : a));
      }

      return {
        success: true,
        message: txResult.message,
        record: txResult.record,
        isDuplicate: false
      };
    } catch (err: any) {
      return { success: false, message: err?.message || "Lỗi hệ thống khi ghi nhận điểm danh." };
    }
  };

  const restoreSampleActivities = async () => {
    if (user.currentRole.roleLevel < 4) {
      showToast('Chỉ Quản trị viên Cấp 4 mới có quyền sử dụng công cụ khôi phục dữ liệu!', 'error');
      return;
    }
    if (import.meta.env.PROD) {
      showToast('Tính năng khôi phục hoạt động mẫu đã bị vô hiệu hóa trên môi trường Production để bảo toàn dữ liệu thực.', 'error');
      return;
    }
    const confirmed = window.confirm(
      'CẢNH BÁO AN TOÀN:\nBạn đang yêu cầu nạp lại danh sách hoạt động mẫu.\nBạn có chắc chắn muốn tiếp tục?'
    );
    if (!confirmed) return;

    setActivities(INITIAL_ACTIVITIES);
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(INITIAL_ACTIVITIES));
    try {
      await batchSaveActivitiesToFirestore(INITIAL_ACTIVITIES);
      showToast('Đã khôi phục thành công danh sách hoạt động mẫu!', 'success');
    } catch (err: any) {
      showToast(`Lỗi lưu hoạt động mẫu lên Firestore: ${err?.message || 'Lỗi'}`, 'error');
    }
  };

  // Student Inline & Modal Edit (Cập nhật thông tin Đoàn viên / Sinh viên an toàn, bảo toàn LocalStorage & Firestore)
  const updateStudent = (studentId: string, updates: Partial<StudentScoreRecord>, reason?: string) => {
    let targetUpdated: StudentScoreRecord | null = null;
    let scoreDifference = 0;
    let previousScoresSnapshot: ScoreSnapshot | null = null;
    let previousStudentSnapshot: StudentScoreRecord | null = null;
    let targetStudentName = '';
    let targetClassCode = '';
    let targetFacultyCode = '';

    const cleanTargetId = (studentId || '').trim().toLowerCase();
    if (!cleanTargetId) return;

    const oldStudentIdClean = (studentId || '').trim();
    const newStudentIdClean = updates.studentId ? updates.studentId.trim() : oldStudentIdClean;
    const isStudentIdChanged = newStudentIdClean && newStudentIdClean !== oldStudentIdClean;

    setAllStudents(prevAll => {
      let found = false;
      const nextAll = prevAll.map(std => {
        if (!std || !std.studentId) return std;
        if (std.studentId.trim().toLowerCase() !== cleanTargetId) return std;
        found = true;

        previousStudentSnapshot = JSON.parse(JSON.stringify(std));
        previousScoresSnapshot = {
          bonusScore: std.bonusScore,
          positionScore: std.positionScore,
          researchScore: std.researchScore,
          activityScore: std.activityScore,
          totalScore: std.totalScore,
          rankGrade: std.rankGrade,
          rankGeneral: std.rankGeneral
        };
        targetStudentName = std.fullName;
        targetClassCode = std.classCode;
        targetFacultyCode = std.facultyCode;

        const updated = { ...std, ...updates };
        if (isStudentIdChanged) {
          updated.studentId = newStudentIdClean;
        }

        if (updates.clubCode !== undefined || updates.clubCodes !== undefined) {
          const cCode = updates.clubCode || (updates.clubCodes && updates.clubCodes[0]);
          const foundClub = cCode ? organizations.find(o => o.code === cCode) : undefined;
          if (foundClub) {
            updated.clubName = foundClub.name;
            updated.clubCategory = getClubCategory(foundClub).category;
          }
        }

        const totalScore = Math.max(
          0,
          (Number(updated.bonusScore) || 0) +
          (Number(updated.positionScore) || 0) +
          (Number(updated.researchScore) || 0) +
          (Number(updated.activityScore) || 0)
        );
        const rankGrade = calculateRankGrade(totalScore, updated.academicYearNumber);
        const rankGeneral = calculateGeneralRank(totalScore);
        const autoCriteria = computeAutoSv5t({ ...updated, totalScore, rankGrade }, activities, selfProofs);
        const isSv5tEligible = checkSv5tEligibility(autoCriteria).isEligible;

        const res: StudentScoreRecord = {
          ...updated,
          totalScore,
          rankGrade,
          rankGeneral,
          sv5tCriteriaAchieved: autoCriteria,
          isSv5tEligible,
          updatedAt: new Date().toISOString(),
          updatedBy: user?.email || std.updatedBy || 'system'
        };
        targetUpdated = res;
        scoreDifference = totalScore - std.totalScore;
        return res;
      });

      if (found) {
        try {
          localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(nextAll));
        } catch (e) {
          console.warn('Failed to save updated students to localStorage:', e);
        }
      }
      return nextAll;
    });

    if (targetUpdated) {
      const stdObj = targetUpdated as StudentScoreRecord;
      
      // Nếu đổi MSSV, xóa bản ghi cũ ở Firestore
      if (isStudentIdChanged) {
        deleteStudentFromFirestore(oldStudentIdClean).catch(err => console.warn('Firestore delete old student doc error:', err));
      }

      saveStudentToFirestore(stdObj).catch(err => {
        console.warn('Firestore update student error:', err);
        firestoreRetryQueue.enqueue('SAVE_STUDENT', `Cập nhật điểm sinh viên "${stdObj.fullName}" (${stdObj.studentId})`, stdObj, { docId: stdObj.studentId, collectionName: 'students' });
      });

      // Ghi vết kiểm toán chi tiết trạng thái trước & sau vào collection 'audit_logs'
      recordStudentAuditLog(
        'UPDATE_STUDENT',
        `Cập nhật thông tin Đoàn viên [${stdObj.fullName}] (${stdObj.studentId})`,
        previousStudentSnapshot,
        stdObj,
        reason || 'Chỉnh sửa trực tiếp qua Sổ Điểm / Danh mục Sinh Viên'
      );

      // Ghi vết kiểm toán (Audit Log)
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const timestampStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      
      const newSnapshot: ScoreSnapshot = {
        bonusScore: (targetUpdated as StudentScoreRecord).bonusScore,
        positionScore: (targetUpdated as StudentScoreRecord).positionScore,
        researchScore: (targetUpdated as StudentScoreRecord).researchScore,
        activityScore: (targetUpdated as StudentScoreRecord).activityScore,
        totalScore: (targetUpdated as StudentScoreRecord).totalScore,
        rankGrade: (targetUpdated as StudentScoreRecord).rankGrade,
        rankGeneral: (targetUpdated as StudentScoreRecord).rankGeneral
      };

      const auditLogEntry: ScoreAuditLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: timestampStr,
        studentId: stdObj.studentId,
        studentName: stdObj.fullName || targetStudentName,
        classCode: stdObj.classCode || targetClassCode,
        facultyCode: stdObj.facultyCode || targetFacultyCode,
        actionType: 'MODAL_EDIT',
        actionTitle: scoreDifference > 0 
          ? `Điều chỉnh tăng +${scoreDifference} điểm rèn luyện` 
          : scoreDifference < 0 
          ? `Điều chỉnh giảm ${scoreDifference} điểm rèn luyện` 
          : 'Cập nhật điều chỉnh thông tin sinh viên/Đoàn viên',
        performedBy: {
          userId: user.id || 'usr_current',
          userName: user.fullName || user.email,
          userEmail: user.email,
          roleName: user.currentRole.roleName,
          roleLevel: user.currentRole.roleLevel,
          orgCode: user.currentRole.orgCode
        },
        previousScores: previousScoresSnapshot || newSnapshot,
        newScores: newSnapshot,
        scoreDifference,
        reason: reason || 'Chỉnh sửa trực tiếp qua Sổ Điểm / Danh mục Sinh Viên',
        ipAddress: '172.16.8.24 (Mạng Nội Bộ NLU)'
      };

      setScoreAuditLogs(prev => [auditLogEntry, ...prev]);

      notifyScoreUpdated(targetUpdated, scoreDifference !== 0 ? scoreDifference : undefined);

      // Gửi push notification cho sinh viên được cập nhật
      sendStudentPushNotification(stdObj.studentId, {
        type: 'score_updated',
        title: '📝 Cập Nhật Thông Tin Đoàn Viên',
        message: `Hồ sơ Đoàn viên/Sinh viên của bạn vừa được cập nhật thành công: Lớp ${stdObj.classCode} • Khoa ${stdObj.facultyCode} • Tổng ${stdObj.totalScore}đ.`,
        scoreDiff: scoreDifference,
        linkTab: 'student-portal'
      });

      showToast(`Đã cập nhật thông tin Đoàn viên [${stdObj.fullName}] (${stdObj.studentId}) thành công!`, 'success');
    } else {
      showToast(`Đã lưu thông tin sinh viên [${updates.fullName || studentId}]`, 'info');
    }
  };

  // Batch Update Students (Yêu cầu 5 & Cập nhật Khóa năm học hàng loạt)
  const batchUpdateStudents = (
    studentIds: string[],
    action: { bonusAdd?: number; membershipType?: StudentMembership; academicYearNumber?: number; recalculate?: boolean; clubCode?: string; clubCodes?: string[] }
  ) => {
    if (!studentIds.length) return;

    const beforeMap = new Map<string, StudentScoreRecord>();
    students.forEach(s => {
      if (studentIds.includes(s.studentId)) {
        beforeMap.set(s.studentId, JSON.parse(JSON.stringify(s)));
      }
    });

    const affectedStudents: StudentScoreRecord[] = [];

    const nextStudents = students.map(std => {
      if (!studentIds.includes(std.studentId)) return std;

      let clubCodes = std.clubCodes || [];
      let clubCode = std.clubCode;
      let clubName = std.clubName;
      let clubCategory = std.clubCategory;

      if (action.clubCode) {
        clubCode = action.clubCode;
        const foundClub = organizations.find(o => o.code === action.clubCode);
        clubName = foundClub ? foundClub.name : action.clubCode;
        clubCategory = foundClub ? getClubCategory(foundClub).category : undefined;
        clubCodes = Array.from(new Set([...clubCodes, action.clubCode]));
      } else if (action.clubCodes) {
        clubCodes = action.clubCodes;
        clubCode = action.clubCodes[0] || undefined;
        const foundClub = clubCode ? organizations.find(o => o.code === clubCode) : undefined;
        clubName = foundClub?.name;
        clubCategory = foundClub ? getClubCategory(foundClub).category : undefined;
      }

      // Reconstruct student totals directly from source activity contributions and highest proof score
      const reconstructed = reconstructStudentTotalsFromSource(std, activities, {
        bonusAdd: action.bonusAdd,
        membershipType: action.membershipType,
        academicYearNumber: action.academicYearNumber,
        clubCode,
        clubCodes,
        selfProofs
      });

      const autoCriteria = computeAutoSv5t(
        { ...reconstructed, clubName, clubCategory },
        activities,
        selfProofs
      );
      const isSv5tEligible = checkSv5tEligibility(autoCriteria).isEligible;

      const updatedRec: StudentScoreRecord = {
        ...reconstructed,
        clubName,
        clubCategory,
        sv5tCriteriaAchieved: autoCriteria,
        isSv5tEligible
      };
      affectedStudents.push(updatedRec);
      return updatedRec;
    });

    setStudents(nextStudents);
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(nextStudents));
    } catch (e) {
      console.warn('Failed to save updated students to localStorage:', e);
    }

    if (affectedStudents.length > 0) {
      batchSaveStudentsToFirestore(affectedStudents)
        .then(() => {
          showToast(`Đã lưu đồng bộ Firestore thành công cho ${affectedStudents.length} sinh viên!`, 'success');
        })
        .catch(err => {
          console.warn('Firestore batch update students error:', err);
          firestoreRetryQueue.enqueue(
            'BATCH_SAVE_STUDENTS',
            `Cập nhật hàng loạt cho ${affectedStudents.length} sinh viên`,
            affectedStudents
          );
          showToast('Lưu Firestore gặp sự cố kết nối. Đã lưu tạm vào Hàng Đợi Thử Lại (Retry-Queue) để tự động đồng bộ.', 'warning');
        });
    }

    // Ghi vết kiểm toán cho thao tác hàng loạt
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestampStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const cohortNames: Record<number, string> = {
      1: 'Khóa 52 (Năm 1)',
      2: 'Khóa 51 (Năm 2)',
      3: 'Khóa 50 (Năm 3)',
      4: 'Khóa 49 (Năm 4)',
      5: 'Khóa 48+ (Năm 5+)'
    };

    const actionTitle = action.bonusAdd
      ? `Cộng điểm thưởng hàng loạt (+${action.bonusAdd}đ)`
      : action.membershipType
      ? `Chuyển đối tượng Đoàn/Hội hàng loạt (${action.membershipType})`
      : action.academicYearNumber
      ? `Điều chỉnh Khóa năm học hàng loạt -> ${cohortNames[action.academicYearNumber] || `Năm ${action.academicYearNumber}`}`
      : 'Chuẩn hóa xếp loại thi đua hàng loạt';

    affectedStudents.forEach(afterRec => {
      const beforeRec = beforeMap.get(afterRec.studentId) || null;
      recordStudentAuditLog(
        'BATCH_UPDATE',
        actionTitle,
        beforeRec,
        afterRec,
        'Cập nhật dữ liệu Đoàn viên hàng loạt'
      );
    });

    const batchAuditLog: ScoreAuditLog = {
      id: `log_batch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: timestampStr,
      studentId: `BATCH_${studentIds.length}_SV`,
      studentName: `Cập nhật hàng loạt cho ${studentIds.length} sinh viên`,
      classCode: 'Nhiều lớp',
      facultyCode: 'Nhiều khoa',
      actionType: action.bonusAdd ? 'BATCH_BONUS' : action.membershipType ? 'BATCH_MEMBERSHIP' : 'BATCH_RECALCULATE',
      actionTitle,
      performedBy: {
        userId: user.id || 'usr_current',
        userName: user.fullName || user.email,
        userEmail: user.email,
        roleName: user.currentRole.roleName,
        roleLevel: user.currentRole.roleLevel,
        orgCode: user.currentRole.orgCode
      },
      previousScores: {
        bonusScore: 0,
        positionScore: 0,
        researchScore: 0,
        activityScore: 0,
        totalScore: 0
      },
      newScores: {
        bonusScore: action.bonusAdd || 0,
        positionScore: 0,
        researchScore: 0,
        activityScore: 0,
        totalScore: action.bonusAdd || 0
      },
      scoreDifference: action.bonusAdd || 0,
      reason: action.academicYearNumber
        ? `Điều chỉnh Khóa đào tạo hàng loạt sang ${cohortNames[action.academicYearNumber] || `Năm ${action.academicYearNumber}`}`
        : action.bonusAdd 
        ? `Thao tác cộng điểm thi đua hàng loạt cho ${studentIds.length} sinh viên được chọn` 
        : `Chuẩn hóa quy chế xếp loại Đoàn - Hội theo niên khóa`,
      affectedStudentCount: studentIds.length,
      ipAddress: '172.16.8.24 (Mạng Nội Bộ NLU)'
    };
    setScoreAuditLogs(prev => [batchAuditLog, ...prev]);

    notifyBatchScoresUpdated(
      studentIds.length,
      action.academicYearNumber
        ? `(Đã chuyển sang ${cohortNames[action.academicYearNumber] || `Năm ${action.academicYearNumber}`})`
        : action.bonusAdd
        ? `(Cộng +${action.bonusAdd} điểm thưởng)`
        : action.recalculate
        ? '(Đã chuẩn hóa xếp loại theo quy chế)'
        : undefined
    );

    // Gửi push notification đến từng sinh viên được cập nhật
    studentIds.forEach(stdId => {
      sendStudentPushNotification(stdId, {
        type: 'score_updated',
        title: action.bonusAdd ? '⚡ Cộng Điểm Thi Đua Rèn Luyện' : '📈 Chuẩn Hóa Điểm Rèn Luyện',
        message: action.bonusAdd
          ? `Bạn vừa được cộng thêm +${action.bonusAdd} điểm thi đua rèn luyện! Kiểm tra sổ điểm cá nhân ngay.`
          : 'Điểm rèn luyện và xếp loại thi đua của bạn đã được cập nhật chuẩn hóa theo quy chế Đoàn - Hội.',
        scoreDiff: action.bonusAdd,
        linkTab: 'student-portal'
      });
    });
  };

  const validateActivityContributions = React.useCallback((): ActivityContributionValidationReport => {
    return validateActivityContributionsAgainstStudents(students, activities);
  }, [students, activities]);

  // Self Proofs
  const addSelfProof = (proofData: Omit<StudentSelfProof, 'id' | 'status' | 'submissionDate'>) => {
    const newProof: StudentSelfProof = {
      ...proofData,
      id: `prf_${Date.now()}`,
      status: 'Pending',
      submissionDate: new Date().toISOString().split('T')[0],
    };
    setSelfProofs(prev => [newProof, ...prev]);
    showToast('Đã nộp hồ sơ minh chứng thành công! Đang chờ duyệt.', 'success');
  };

  const reviewSelfProof = (id: string, decision: 'approve' | 'reject', approvedScore?: number, notes?: string) => {
    const target = selfProofs.find(p => p.id === id);
    if (!target) return;

    const scoreAdd = approvedScore !== undefined ? approvedScore : target.scoreClaimed;
    const finalStatus = decision === 'approve' ? 'Approved' : 'Rejected';
    const finalScore = decision === 'approve' ? scoreAdd : 0;

    let updatedSelfProofs: StudentSelfProof[] = [];
    setSelfProofs(prev => {
      updatedSelfProofs = prev.map(p => {
        if (p.id !== id) return p;
        return {
          ...p,
          status: finalStatus,
          approvedScore: finalScore,
          reviewDate: new Date().toISOString().split('T')[0],
          reviewNotes: notes,
        };
      });
      return updatedSelfProofs;
    });

    if (decision === 'approve') {
      let studentAfterProof: StudentScoreRecord | null = null;
      let previousSnapshot: ScoreSnapshot | null = null;

      // Quy tắc NLU: Sinh viên được nộp nhiều minh chứng nhưng CHỈ TÍNH ĐIỂM CAO NHẤT trong từng nhóm
      const studentApprovedProofs = (updatedSelfProofs.length > 0 ? updatedSelfProofs : selfProofs).filter(
        p => p.studentId === target.studentId && (p.id === id ? true : p.status === 'Approved')
      );

      const maxKhenThuong = Math.max(0, ...studentApprovedProofs.filter(p => p.type === 'KHEN_THUONG').map(p => p.id === id ? finalScore : (p.approvedScore ?? p.scoreClaimed ?? 0)));
      const maxChucVu = Math.max(0, ...studentApprovedProofs.filter(p => p.type === 'CHUC_VU').map(p => p.id === id ? finalScore : (p.approvedScore ?? p.scoreClaimed ?? 0)));
      const maxNckh = Math.max(0, ...studentApprovedProofs.filter(p => p.type === 'NCKH').map(p => p.id === id ? finalScore : (p.approvedScore ?? p.scoreClaimed ?? 0)));
      const maxParty = Math.max(0, ...studentApprovedProofs.filter(p => p.type === 'DANG_VIEN_HUONG_DAN').map(p => p.id === id ? finalScore : (p.approvedScore ?? p.scoreClaimed ?? 0)));

      setStudents(prev =>
        prev.map(s => {
          if (s.studentId !== target.studentId) return s;
          previousSnapshot = {
            bonusScore: s.bonusScore,
            positionScore: s.positionScore,
            researchScore: s.researchScore,
            activityScore: s.activityScore,
            totalScore: s.totalScore,
            rankGrade: s.rankGrade,
            rankGeneral: s.rankGeneral
          };

          // Lấy điểm cao nhất giữa minh chứng đã duyệt và điểm cơ sở
          const bonusScore = Math.max(maxKhenThuong, maxParty, s.bonusScore);
          const positionScore = Math.max(maxChucVu, s.positionScore);
          const researchScore = Math.max(maxNckh, s.researchScore);

          const totalScore = (s.activityScore || 0) + bonusScore + positionScore + researchScore;
          const rankGrade = calculateRankGrade(totalScore, s.academicYearNumber);
          const rankGeneral = calculateGeneralRank(totalScore);

          const res: StudentScoreRecord = {
            ...s,
            bonusScore,
            positionScore,
            researchScore,
            totalScore,
            rankGrade,
            rankGeneral
          };
          studentAfterProof = res;
          return res;
        })
      );

      if (studentAfterProof) {
        saveStudentToFirestore(studentAfterProof).catch(err => console.warn('Firestore review proof save error:', err));
        // Ghi vết kiểm toán cho việc duyệt minh chứng
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const timestampStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

        const proofAuditLog: ScoreAuditLog = {
          id: `log_prf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: timestampStr,
          studentId: target.studentId,
          studentName: (studentAfterProof as StudentScoreRecord).fullName,
          classCode: (studentAfterProof as StudentScoreRecord).classCode,
          facultyCode: (studentAfterProof as StudentScoreRecord).facultyCode,
          actionType: 'PROOF_APPROVAL',
          actionTitle: `Duyệt minh chứng ${target.type === 'KHEN_THUONG' ? 'Khen thưởng' : target.type === 'CHUC_VU' ? 'Chức vụ' : 'NCKH'}: +${scoreAdd} điểm`,
          performedBy: {
            userId: user.id || 'usr_current',
            userName: user.fullName || user.email,
            userEmail: user.email,
            roleName: user.currentRole.roleName,
            roleLevel: user.currentRole.roleLevel,
            orgCode: user.currentRole.orgCode
          },
          previousScores: previousSnapshot || {
            bonusScore: 0,
            positionScore: 0,
            researchScore: 0,
            activityScore: 0,
            totalScore: 0
          },
          newScores: {
            bonusScore: (studentAfterProof as StudentScoreRecord).bonusScore,
            positionScore: (studentAfterProof as StudentScoreRecord).positionScore,
            researchScore: (studentAfterProof as StudentScoreRecord).researchScore,
            activityScore: (studentAfterProof as StudentScoreRecord).activityScore,
            totalScore: (studentAfterProof as StudentScoreRecord).totalScore,
            rankGrade: (studentAfterProof as StudentScoreRecord).rankGrade,
            rankGeneral: (studentAfterProof as StudentScoreRecord).rankGeneral
          },
          scoreDifference: scoreAdd,
          reason: `Duyệt hồ sơ minh chứng cá nhân: "${target.title}"${notes ? ` (Ghi chú: ${notes})` : ''}`,
          ipAddress: '172.16.8.24 (Mạng Nội Bộ NLU)'
        };
        setScoreAuditLogs(prev => [proofAuditLog, ...prev]);

        notifyScoreUpdated(studentAfterProof, scoreAdd, `(Duyệt minh chứng "${target.title}")`);

        sendStudentPushNotification(target.studentId, {
          type: 'proof_approved',
          title: '✅ Minh Chứng ĐRL Đã Được Duyệt',
          message: `Minh chứng "${target.title}" đã được Đoàn - Hội phê duyệt chính thức (+${scoreAdd} điểm)! Điểm đã được cộng vào sổ rèn luyện.`,
          scoreDiff: scoreAdd,
          linkTab: 'student-portal'
        });
      } else {
        showToast(`Đã duyệt minh chứng (+${scoreAdd} điểm ĐRL)`, 'success');
      }
    } else {
      showToast('Đã từ chối minh chứng', 'info');
    }
  };

  const toggleSv5tCriterion = (studentId: string, criterionId: string) => {
    let updatedTarget: StudentScoreRecord | null = null;
    setStudents(prev =>
      prev.map(std => {
        if (std.studentId !== studentId) return std;
        const currentMap = std.sv5tCriteriaAchieved || {};
        const newMap = { ...currentMap, [criterionId]: !currentMap[criterionId] };
        const { isEligible } = checkSv5tEligibility(newMap);
        updatedTarget = {
          ...std,
          sv5tCriteriaAchieved: newMap,
          isSv5tEligible: isEligible
        };
        return updatedTarget;
      })
    );
    if (updatedTarget) saveStudentToFirestore(updatedTarget).catch(err => console.warn('Firestore toggle sv5t error:', err));
  };

  // Accounts
  const addAccount = (acc: Omit<SystemUserAccount, 'id' | 'createdAt'>) => {
    const cleanEmail = acc.email.toLowerCase().trim();
    const newAcc: SystemUserAccount = {
      ...acc,
      id: `acc_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      email: cleanEmail,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setAccounts(prev => [newAcc, ...prev]);
    saveSystemAccountToFirestore(newAcc).catch(err => console.warn('Firestore add account error:', err));
    showToast(`Đã tạo tài khoản cho ${acc.fullName}`, 'success');

    // Ghi nhật ký hệ thống Cấp 4
    addSystemActivityLog({
      category: 'ACCOUNT_PERMISSION',
      actionTitle: 'Cấp quyền tài khoản Google SSO',
      actionDetail: `Cấp quyền Cấp ${acc.roleLevel} cho email [${cleanEmail}] (${acc.fullName}) thuộc đơn vị [${acc.orgCode}]`,
      severity: 'success',
      performedBy: {
        userId: user.id,
        userName: user.fullName,
        userEmail: user.email,
        roleName: user.currentRole.roleName,
        roleLevel: user.currentRole.roleLevel
      },
      targetEntity: {
        type: 'ACCOUNT',
        id: newAcc.id,
        name: `${acc.fullName} (${cleanEmail})`
      },
      changes: [
        { field: 'roleLevel', newValue: `Cấp ${acc.roleLevel}` },
        { field: 'orgCode', newValue: acc.orgCode },
        { field: 'status', newValue: 'Active' }
      ]
    });
  };

  const batchAddAccounts = (accs: Omit<SystemUserAccount, 'id' | 'createdAt'>[]) => {
    const existingEmails = new Set(accounts.map(a => a.email.toLowerCase().trim()));
    const validAccs: SystemUserAccount[] = [];
    const now = new Date().toISOString().split('T')[0];
    accs.forEach((a, idx) => {
      const em = a.email.trim().toLowerCase();
      if (!existingEmails.has(em)) {
        existingEmails.add(em);
        validAccs.push({
          ...a,
          email: em,
          id: `acc_${em.replace(/[^a-zA-Z0-9]/g, '_')}`,
          createdAt: now,
          status: a.status || 'Active',
        });
      }
    });
    if (validAccs.length > 0) {
      setAccounts(prev => [...validAccs, ...prev]);
      batchSaveSystemAccountsToFirestore(validAccs).catch(err => console.warn('Firestore batch save accounts error:', err));
      showToast(`Đã cấp thành công ${validAccs.length} tài khoản mới!`, 'success');

      addSystemActivityLog({
        category: 'ACCOUNT_PERMISSION',
        actionTitle: 'Nhập & Cấp quyền tài khoản hàng loạt',
        actionDetail: `Đã nạp thành công ${validAccs.length} tài khoản cán bộ vào hệ thống`,
        severity: 'success',
        performedBy: {
          userId: user.id,
          userName: user.fullName,
          userEmail: user.email,
          roleName: user.currentRole.roleName,
          roleLevel: user.currentRole.roleLevel
        }
      });
    }
    return validAccs.length;
  };

  const updateAccount = (id: string, updates: Partial<SystemUserAccount>) => {
    const target = accounts.find(a => a.id === id);
    let updatedAcc: SystemUserAccount | null = null;
    setAccounts(prev => prev.map(a => {
      if (a.id === id) {
        updatedAcc = { ...a, ...updates };
        return updatedAcc;
      }
      return a;
    }));
    if (updatedAcc) {
      saveSystemAccountToFirestore(updatedAcc).catch(err => console.warn('Firestore update account error:', err));
    }
    showToast('Đã cập nhật tài khoản', 'success');

    if (target) {
      addSystemActivityLog({
        category: 'ACCOUNT_PERMISSION',
        actionTitle: 'Cập nhật phân quyền cán bộ',
        actionDetail: `Chỉnh sửa thông tin/vai trò của cán bộ ${target.fullName} (${target.email})`,
        severity: 'info',
        performedBy: {
          userId: user.id,
          userName: user.fullName,
          userEmail: user.email,
          roleName: user.currentRole.roleName,
          roleLevel: user.currentRole.roleLevel
        },
        targetEntity: {
          type: 'ACCOUNT',
          id: target.id,
          name: `${target.fullName} (${target.email})`
        }
      });
    }
  };

  const toggleAccountStatus = (id: string) => {
    const target = accounts.find(a => a.id === id);
    const nextStatus = target?.status === 'Active' ? 'Inactive' : 'Active';
    let updatedAcc: SystemUserAccount | null = null;
    setAccounts(prev =>
      prev.map(a => {
        if (a.id !== id) return a;
        updatedAcc = { ...a, status: nextStatus };
        return updatedAcc;
      })
    );
    if (updatedAcc) {
      saveSystemAccountToFirestore(updatedAcc).catch(err => console.warn('Firestore toggle account status error:', err));
    }
    showToast(nextStatus === 'Inactive' ? 'Đã tạm khóa tài khoản' : 'Đã mở khóa tài khoản', nextStatus === 'Inactive' ? 'warning' : 'success');

    if (target) {
      addSystemActivityLog({
        category: 'ACCOUNT_PERMISSION',
        actionTitle: nextStatus === 'Inactive' ? 'Tạm khóa quyền tài khoản' : 'Mở khóa quyền tài khoản',
        actionDetail: `${nextStatus === 'Inactive' ? 'Tạm dừng quyền truy cập' : 'Khôi phục hoạt động'} cho cán bộ ${target.fullName} (${target.email})`,
        severity: nextStatus === 'Inactive' ? 'warning' : 'success',
        performedBy: {
          userId: user.id,
          userName: user.fullName,
          userEmail: user.email,
          roleName: user.currentRole.roleName,
          roleLevel: user.currentRole.roleLevel
        },
        targetEntity: {
          type: 'ACCOUNT',
          id: target.id,
          name: `${target.fullName} (${target.email})`
        },
        changes: [
          { field: 'status', oldValue: target.status, newValue: nextStatus }
        ]
      });
    }
  };

  const deleteAccount = (id: string) => {
    const target = accounts.find(a => a.id === id);
    if (target?.email.toLowerCase() === user.email.toLowerCase()) {
      showToast('Không thể tự thu hồi quyền truy cập hoặc xóa tài khoản của chính mình!', 'error');
      return;
    }
    setAccounts(prev => prev.filter(a => a.id !== id));
    if (target) {
      deleteSystemAccountFromFirestore(target.email).catch(err => console.warn('Firestore delete account error:', err));
    }
    showToast(`Đã thu hồi quyền truy cập của tài khoản [${target?.email || id}]`, 'info');

    if (target) {
      addSystemActivityLog({
        category: 'ACCOUNT_PERMISSION',
        actionTitle: 'Thu hồi & Xóa tài khoản cán bộ',
        actionDetail: `Thu hồi quyền hạn và xóa tài khoản của cán bộ ${target.fullName} (${target.email})`,
        severity: 'danger',
        performedBy: {
          userId: user.id,
          userName: user.fullName,
          userEmail: user.email,
          roleName: user.currentRole.roleName,
          roleLevel: user.currentRole.roleLevel
        },
        targetEntity: {
          type: 'ACCOUNT',
          id: target.id,
          name: `${target.fullName} (${target.email})`
        }
      });
    }
  };

  // Organizations
  const addOrganization = (org: Organization) => {
    const val = validateOrganizationCode(org.code, organizations, true);
    if (!val.isValid) {
      showToast(val.errors.join(' | '), 'error');
      return;
    }
    setOrganizations(prev => [...prev, org]);
    showToast(`Đã thêm đơn vị ${org.name} [${org.code}]`, 'success');
  };

  const batchAddOrganizations = (orgs: Organization[]) => {
    const existingCodes = new Set(organizations.map(o => o.code.toUpperCase()));
    const validOrgs: Organization[] = [];
    orgs.forEach(o => {
      const code = o.code.trim().toUpperCase();
      if (!existingCodes.has(code)) {
        existingCodes.add(code);
        validOrgs.push({
          ...o,
          id: organizations.length + validOrgs.length + 1,
          code,
        });
      }
    });
    if (validOrgs.length > 0) {
      setOrganizations(prev => [...prev, ...validOrgs]);
      showToast(`Đã thêm hàng loạt ${validOrgs.length} đơn vị mới!`, 'success');
    }
    return validOrgs.length;
  };

  const updateOrganization = (code: string, updates: Partial<Organization>) => {
    setOrganizations(prev => prev.map(o => (o.code === code ? { ...o, ...updates } : o)));
    showToast(`Đã cập nhật đơn vị ${code}`, 'success');
  };

  const deleteOrganization = (code: string) => {
    const target = organizations.find(o => o.code === code);
    const nextOrgs = organizations.filter(o => o.code !== code);
    setOrganizations(nextOrgs);
    localStorage.setItem(STORAGE_KEYS.ORGS, JSON.stringify(nextOrgs));
    showToast(`Đã xóa đơn vị [${target?.name || code}] khỏi hệ thống`, 'info');

    addSystemActivityLog({
      category: 'ACCOUNT_PERMISSION',
      actionTitle: 'Xóa đơn vị Đoàn - Hội',
      actionDetail: `Đã xóa đơn vị [${target?.name || code}] (Mã: ${code}) khỏi danh mục tổ chức`,
      severity: 'danger',
      performedBy: {
        userId: user.id,
        userName: user.fullName,
        userEmail: user.email,
        roleName: user.currentRole.roleName,
        roleLevel: user.currentRole.roleLevel
      },
      targetEntity: {
        type: 'ORGANIZATION',
        id: code,
        name: target?.name || code
      }
    });
  };

  const batchDeleteOrganizations = (codes: string[]): number => {
    if (!codes || codes.length === 0) return 0;
    const codeSet = new Set(codes.map(c => c.trim().toUpperCase()));
    const deletedOrgs = organizations.filter(o => codeSet.has(o.code.toUpperCase()));
    if (deletedOrgs.length === 0) return 0;

    const nextOrgs = organizations.filter(o => !codeSet.has(o.code.toUpperCase()));
    setOrganizations(nextOrgs);
    localStorage.setItem(STORAGE_KEYS.ORGS, JSON.stringify(nextOrgs));
    showToast(`Đã xóa hàng loạt ${deletedOrgs.length} đơn vị khỏi hệ thống!`, 'info');

    addSystemActivityLog({
      category: 'ACCOUNT_PERMISSION',
      actionTitle: 'Xóa hàng loạt đơn vị Đoàn - Hội',
      actionDetail: `Đã xóa hàng loạt ${deletedOrgs.length} đơn vị (${deletedOrgs.map(o => o.code).join(', ')}) khỏi danh mục tổ chức`,
      severity: 'danger',
      performedBy: {
        userId: user.id,
        userName: user.fullName,
        userEmail: user.email,
        roleName: user.currentRole.roleName,
        roleLevel: user.currentRole.roleLevel
      },
      targetEntity: {
        type: 'ORGANIZATION',
        id: codes.slice(0, 3).join(', ') + (codes.length > 3 ? '...' : ''),
        name: `Bộ ${deletedOrgs.length} đơn vị Đoàn - Hội`
      }
    });

    return deletedOrgs.length;
  };

  const addBranchClass = (cls: Omit<BranchClass, 'id'>) => {
    const val = validateClassCode(cls.code, branchClasses, true);
    if (!val.isValid) {
      showToast(val.errors.join(' | '), 'error');
      return;
    }
    const newCls: BranchClass = {
      ...cls,
      id: `class_${Date.now()}`
    };
    setBranchClasses(prev => [...prev, newCls]);
    showToast(`Đã thêm chi đoàn ${cls.name}`, 'success');
  };

  const batchAddBranchClasses = (classes: Omit<BranchClass, 'id'>[]) => {
    const existingCodes = new Set(branchClasses.map(c => c.code.toUpperCase()));
    const validClasses: BranchClass[] = [];
    classes.forEach((cls, idx) => {
      const code = cls.code.trim().toUpperCase();
      if (!existingCodes.has(code)) {
        existingCodes.add(code);
        validClasses.push({
          ...cls,
          id: `class_${Date.now()}_${idx}`,
          code,
        });
      }
    });
    if (validClasses.length > 0) {
      setBranchClasses(prev => [...prev, ...validClasses]);
      showToast(`Đã thêm hàng loạt ${validClasses.length} chi đoàn mới!`, 'success');
    }
    return validClasses.length;
  };

  const updateBranchClass = (code: string, updates: Partial<BranchClass>) => {
    const normCode = code.trim().toUpperCase();
    setBranchClasses(prev =>
      prev.map(c => {
        if (c.code.toUpperCase() === normCode || c.id === code) {
          return {
            ...c,
            ...updates,
            code: updates.code ? updates.code.trim().toUpperCase() : c.code
          };
        }
        return c;
      })
    );
    showToast(`Đã cập nhật thông tin chi đoàn ${updates.name || code}!`, 'success');
  };

  const deleteBranchClass = (code: string) => {
    const normCode = code.trim().toUpperCase();
    const target = branchClasses.find(c => c.code.toUpperCase() === normCode || c.id === code);
    setBranchClasses(prev => prev.filter(c => c.code.toUpperCase() !== normCode && c.id !== code));
    showToast(`Đã xóa chi đoàn ${target?.name || code}!`, 'info');
  };

  const batchDeleteBranchClasses = (codes: string[]): number => {
    if (!codes || codes.length === 0) return 0;
    const codeSet = new Set(codes.map(c => c.trim().toUpperCase()));
    const deletedClasses = branchClasses.filter(c => codeSet.has(c.code.toUpperCase()) || (c.id && codeSet.has(c.id.toUpperCase())));
    if (deletedClasses.length === 0) return 0;

    const nextClasses = branchClasses.filter(c => !codeSet.has(c.code.toUpperCase()) && (!c.id || !codeSet.has(c.id.toUpperCase())));
    setBranchClasses(nextClasses);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(nextClasses));
    showToast(`Đã xóa hàng loạt ${deletedClasses.length} chi đoàn khỏi hệ thống!`, 'info');
    return deletedClasses.length;
  };

  // Certificate Management
  const updateCertificateTemplate = (updates: Partial<CertificateTemplate>) => {
    setCertificateTemplate(prev => ({ ...prev, ...updates }));
    showToast('Đã lưu cấu hình mẫu Giấy chứng nhận!', 'success');
  };

  const issueCertificate = (activityId: string, studentId: string, role: ParticipantRoleType) => {
    const activity = activities.find(a => a.id === activityId);
    const student = students.find(s => s.studentId === studentId);
    if (!activity || !student) return;

    const certCode = `GCN-2026-${activity.id}-${student.studentId}`;
    if (issuedCertificates.some(c => c.code === certCode)) {
      showToast(`Giấy chứng nhận ${certCode} đã được cấp trước đó.`, 'info');
      return;
    }

    const newCert: IssuedCertificate = {
      id: `cert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      code: certCode,
      activityId: activity.id,
      activityTitle: activity.title,
      studentId: student.studentId,
      studentName: student.fullName,
      classCode: student.classCode,
      facultyCode: student.facultyCode,
      role,
      issueDate: new Date().toISOString().split('T')[0],
      qrCodeUrl: `https://ais-dev-pkfxtcvzc7utzlvet2ceoj-872190420203.asia-southeast1.run.app/verify/${certCode}`,
    };

    setIssuedCertificates(prev => [newCert, ...prev]);
    saveIssuedCertificateToFirestore(newCert).catch(err => console.warn('Firestore cert save error:', err));
    showToast(`Đã phát hành Giấy chứng nhận ${certCode} cho ${student.fullName}!`, 'success');
  };

  const issueBatchCertificates = (activityId: string) => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity || !activity.participants || activity.participants.length === 0) {
      showToast('Chưa có danh sách sinh viên tham gia để phát hành GCN!', 'error');
      return 0;
    }

    let count = 0;
    const newCerts: IssuedCertificate[] = [];
    const existingCodes = new Set(issuedCertificates.map(c => c.code));

    activity.participants.forEach(p => {
      const certCode = `GCN-2026-${activity.id}-${p.studentId}`;
      if (!existingCodes.has(certCode)) {
        existingCodes.add(certCode);
        count++;
        newCerts.push({
          id: `cert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}_${count}`,
          code: certCode,
          activityId: activity.id,
          activityTitle: activity.title,
          studentId: p.studentId,
          studentName: p.fullName,
          classCode: p.classCode || '',
          facultyCode: p.facultyCode || activity.orgCode,
          role: p.role,
          issueDate: new Date().toISOString().split('T')[0],
          qrCodeUrl: `https://ais-dev-pkfxtcvzc7utzlvet2ceoj-872190420203.asia-southeast1.run.app/verify/${certCode}`,
        });
      }
    });

    if (count > 0) {
      setIssuedCertificates(prev => [...newCerts, ...prev]);
      batchSaveIssuedCertificatesToFirestore(newCerts).catch(err => console.warn('Firestore cert batch save error:', err));
      showToast(`Đã phát hành hàng loạt ${count} Giấy chứng nhận điện tử cho hoạt động ${activity.id}!`, 'success');
    } else {
      showToast('Tất cả sinh viên trong hoạt động này đã có GCN.', 'info');
    }
    return count;
  };

  const updateIssuedCertificate = (certId: string, updates: Partial<IssuedCertificate>) => {
    let updatedCert: IssuedCertificate | null = null;
    setIssuedCertificates(prev => {
      const next = prev.map(c => {
        if (c.id === certId || c.code === certId) {
          updatedCert = { ...c, ...updates };
          return updatedCert;
        }
        return c;
      });
      localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(next));
      return next;
    });

    if (updatedCert) {
      saveIssuedCertificateToFirestore(updatedCert).catch(err => console.warn('Firestore cert update error:', err));
      showToast('Đã cập nhật thông tin Giấy chứng nhận!', 'success');

      addSystemActivityLog({
        category: 'ACTIVITY_WORKFLOW',
        actionTitle: 'Chỉnh sửa thông tin Giấy chứng nhận',
        actionDetail: `Điều chỉnh Giấy chứng nhận [${(updatedCert as IssuedCertificate).code}] của sinh viên ${(updatedCert as IssuedCertificate).studentName} (${(updatedCert as IssuedCertificate).studentId})`,
        severity: 'success',
        performedBy: {
          userId: user.id || 'usr_current',
          userName: user.fullName || user.email,
          userEmail: user.email,
          roleName: user.currentRole.roleName,
          roleLevel: user.currentRole.roleLevel
        }
      });
    }
  };

  const deleteIssuedCertificate = (certId: string) => {
    let deletedCode = certId;
    setIssuedCertificates(prev => {
      const target = prev.find(c => c.id === certId || c.code === certId);
      if (target) deletedCode = target.code;
      const next = prev.filter(c => c.id !== certId && c.code !== certId);
      localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(next));
      return next;
    });

    deleteIssuedCertificateFromFirestore(certId).catch(err => console.warn('Firestore cert delete error:', err));
    showToast(`Đã thu hồi/xóa Giấy chứng nhận [${deletedCode}]!`, 'info');

    addSystemActivityLog({
      category: 'ACTIVITY_WORKFLOW',
      actionTitle: 'Xóa/Thu hồi Giấy chứng nhận điện tử',
      actionDetail: `Xóa thành công Giấy chứng nhận mã [${deletedCode}] khỏi hệ thống`,
      severity: 'warning',
      performedBy: {
        userId: user.id || 'usr_current',
        userName: user.fullName || user.email,
        userEmail: user.email,
        roleName: user.currentRole.roleName,
        roleLevel: user.currentRole.roleLevel
      }
    });
  };

  // Custom Navigation Menu Management (Chỉnh sửa menu thủ công Cấp 4)
  const updateCustomNavItems = (items: CustomNavItem[]) => {
    // Sanitize: ensure no custom item lowers the minimum permission below canonical requirement
    const sanitizedItems = items.map(item => {
      const canonical = CANONICAL_NAVIGATION_CONFIG.find(c => c.id === item.id);
      const canonicalMin = canonical?.minLevel ?? 0;
      return {
        ...item,
        minLevel: Math.max(canonicalMin, item.minLevel ?? canonicalMin) as RoleLevel
      };
    });
    setCustomNavItems(sanitizedItems);
    localStorage.setItem(STORAGE_KEYS.NAV_MENU, JSON.stringify(sanitizedItems));
    saveNavigationMenuToFirestore(sanitizedItems).catch(err => console.warn('Firestore nav menu save error:', err));
    showToast('Đã lưu tùy chỉnh Menu điều hướng hệ thống!', 'success');

    addSystemActivityLog({
      category: 'ORGANIZATION_DATA',
      actionTitle: 'Cập nhật Menu điều hướng thủ công (Cấp Trường)',
      actionDetail: `Đã chỉnh sửa cấu trúc / danh sách ${items.length} mục menu trong thanh điều hướng`,
      severity: 'info',
      performedBy: {
        userId: user.id || 'usr_current',
        userName: user.fullName || user.email,
        userEmail: user.email,
        roleName: user.currentRole.roleName,
        roleLevel: user.currentRole.roleLevel
      }
    });
  };

  const resetCustomNavItems = () => {
    setCustomNavItems(DEFAULT_NAV_ITEMS);
    localStorage.setItem(STORAGE_KEYS.NAV_MENU, JSON.stringify(DEFAULT_NAV_ITEMS));
    saveNavigationMenuToFirestore(DEFAULT_NAV_ITEMS).catch(err => console.warn('Firestore nav menu reset error:', err));
    showToast('Đã khôi phục cấu hình Menu mặc định!', 'info');
  };

  // Custom Footer Management (Chỉnh sửa footer Cấp 4)
  const updateFooterConfig = (updates: Partial<FooterConfig>) => {
    setFooterConfig(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEYS.FOOTER_CONFIG, JSON.stringify(next));
      saveFooterConfigToFirestore(next).catch(err => console.warn('Firestore footer config save error:', err));
      return next;
    });
    showToast('Đã lưu tùy chỉnh Footer chân trang hệ thống!', 'success');

    addSystemActivityLog({
      category: 'ORGANIZATION_DATA',
      actionTitle: 'Cập nhật Footer Chân trang (Cấp Trường)',
      actionDetail: 'Đã điều chỉnh thông tin liên hệ, tên đơn vị & bản quyền ở chân trang',
      severity: 'info',
      performedBy: {
        userId: user.id || 'usr_current',
        userName: user.fullName || user.email,
        userEmail: user.email,
        roleName: user.currentRole.roleName,
        roleLevel: user.currentRole.roleLevel
      }
    });
  };

  const resetFooterConfig = () => {
    setFooterConfig(DEFAULT_FOOTER_CONFIG);
    localStorage.setItem(STORAGE_KEYS.FOOTER_CONFIG, JSON.stringify(DEFAULT_FOOTER_CONFIG));
    saveFooterConfigToFirestore(DEFAULT_FOOTER_CONFIG).catch(err => console.warn('Firestore footer config reset error:', err));
    showToast('Đã khôi phục thông tin Footer mặc định!', 'info');
  };

  // Custom Header Branding Management (Chỉnh sửa Logo & Tiêu đề Header Cấp 4)
  const updateHeaderBranding = async (updates: Partial<HeaderBranding>): Promise<{ success: boolean; error?: string }> => {
    const roleLevel = user.currentRole.roleLevel ?? 0;
    if (roleLevel < 4) {
      showToast('Từ chối quyền: Chỉ Quản trị viên Cấp 4 mới được thay đổi nhận diện thương hiệu hệ thống.', 'error');
      return { success: false, error: 'Unauthorized: Level 4 required' };
    }

    try {
      const next = { ...headerBranding, ...updates };
      await saveHeaderBrandingToFirestore(next);
      setHeaderBranding(next);
      localStorage.setItem(STORAGE_KEYS.HEADER_BRANDING, JSON.stringify(next));
      showToast('Đã lưu tùy chỉnh Logo & Thương hiệu Header!', 'success');

      addSystemActivityLog({
        category: 'ORGANIZATION_DATA',
        actionTitle: 'Cập nhật Logo & Thương hiệu Header (Cấp Trường)',
        actionDetail: 'Đã điều chỉnh hình ảnh Logo, Tên nhận diện & Tiêu đề thanh tiêu đề chính',
        severity: 'info',
        performedBy: {
          userId: user.id || 'usr_current',
          userName: user.fullName || user.email,
          userEmail: user.email,
          roleName: user.currentRole.roleName,
          roleLevel: user.currentRole.roleLevel
        }
      });
      return { success: true };
    } catch (err: any) {
      console.error('Failed to save header branding to server:', err);
      showToast('Lỗi lưu cấu hình thương hiệu: ' + (err.message || 'Mất kết nối hoặc xung đột'), 'error');
      return { success: false, error: err.message || 'Server save failed' };
    }
  };

  const resetHeaderBranding = async (): Promise<{ success: boolean; error?: string }> => {
    const roleLevel = user.currentRole.roleLevel ?? 0;
    if (roleLevel < 4) {
      showToast('Từ chối quyền: Chỉ Quản trị viên Cấp 4 mới được reset nhận diện thương hiệu.', 'error');
      return { success: false, error: 'Unauthorized: Level 4 required' };
    }

    try {
      await saveHeaderBrandingToFirestore(DEFAULT_HEADER_BRANDING);
      setHeaderBranding(DEFAULT_HEADER_BRANDING);
      localStorage.setItem(STORAGE_KEYS.HEADER_BRANDING, JSON.stringify(DEFAULT_HEADER_BRANDING));
      showToast('Đã khôi phục nhận diện thương hiệu Header mặc định!', 'info');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to reset header branding on server:', err);
      showToast('Lỗi reset cấu hình thương hiệu: ' + (err.message || 'Mất kết nối'), 'error');
      return { success: false, error: err.message || 'Server reset failed' };
    }
  };

  // System Dictionary & Terminology Management (Danh mục từ, cụm từ Cấp 4)
  const updateSystemTerms = (terms: SystemTermItem[]) => {
    setSystemTerms(terms);
    localStorage.setItem(STORAGE_KEYS.SYSTEM_DICTIONARY, JSON.stringify(terms));
    saveSystemDictionaryToFirestore(terms).catch(err => console.warn('Firestore dictionary save error:', err));
    showToast('Đã lưu điều chỉnh danh mục từ & cụm từ hệ thống!', 'success');

    addSystemActivityLog({
      category: 'ORGANIZATION_DATA',
      actionTitle: 'Cập nhật Danh mục Từ & Cụm Từ Hệ Thống (Cấp Trường)',
      actionDetail: `Đã chỉnh sửa từ ngữ, nhãn giao diện và thuật ngữ (${terms.length} mục) toàn hệ thống`,
      severity: 'info',
      performedBy: {
        userId: user.id || 'usr_current',
        userName: user.fullName || user.email,
        userEmail: user.email,
        roleName: user.currentRole.roleName,
        roleLevel: user.currentRole.roleLevel
      }
    });
  };

  const resetSystemTerms = () => {
    setSystemTerms(DEFAULT_SYSTEM_TERMS);
    localStorage.setItem(STORAGE_KEYS.SYSTEM_DICTIONARY, JSON.stringify(DEFAULT_SYSTEM_TERMS));
    saveSystemDictionaryToFirestore(DEFAULT_SYSTEM_TERMS).catch(err => console.warn('Firestore dictionary reset error:', err));
    showToast('Đã khôi phục danh mục từ ngữ mặc định ban đầu!', 'info');
  };

  const getTerm = (keyOrText: string, fallback?: string): string => {
    const found = systemTerms.find(t => t.key === keyOrText || t.originalText === keyOrText);
    if (found && found.customText && found.customText.trim() !== '') {
      return found.customText;
    }
    return fallback || keyOrText;
  };

  const replaceTerms = (text: string): string => {
    if (!text) return '';
    let result = text;
    systemTerms.forEach(term => {
      if (term.originalText && term.customText && term.originalText !== term.customText) {
        // Replace all occurrences
        result = result.split(term.originalText).join(term.customText);
      }
    });
    return result;
  };

  // Module 1: Backup hệ thống tự động lên Google Drive
  const createSystemBackup = async () => {
    const timestamp = new Date().toLocaleString('vi-VN');
    const nowIso = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `Backup_NLU_Youth_2026_${nowIso}.json`;

    const payload = {
      appName: 'NLU Youth 2026',
      academicYear,
      backupDate: new Date().toISOString(),
      students,
      activities,
      accounts,
      organizations,
      branchClasses,
      selfProofs,
      issuedCertificates,
      certificateTemplate
    };

    let driveFileId: string | undefined;
    let driveUrl: string | undefined;

    if (accessToken) {
      try {
        const driveFile = await backupDatabaseToDrive(accessToken, payload);
        driveFileId = driveFile.id;
        driveUrl = driveFile.webViewLink;
        showToast(`Đã tự động sao lưu dữ liệu lên Google Drive: ${driveFile.name}`, 'success');
      } catch (err: any) {
        console.warn('Backup to Drive failed', err);
      }
    }

    const contentStr = JSON.stringify(payload, null, 2);
    const sizeKb = Math.round(contentStr.length / 1024);

    const newBackup: BackupRecord = {
      id: `bak_${Date.now()}`,
      timestamp,
      fileName,
      fileSizeKb: sizeKb || 1,
      driveFileId,
      driveUrl,
      stats: {
        students: students.length,
        activities: activities.length,
        accounts: accounts.length,
        certificates: issuedCertificates.length
      }
    };

    setBackups(prev => [newBackup, ...prev]);

    if (!accessToken) {
      // Direct file download fallback
      const blob = new Blob([contentStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      showToast(`Đã xuất tệp sao lưu dữ liệu: ${fileName}`, 'success');
    }
  };

  // ============================================================================
  // MASTER TARGETS OPERATIONS (QUẢN LÝ CHỈ TIÊU & ĐÁNH GIÁ THÔNG MINH AI)
  // ============================================================================
  const addTarget = (targetData: Omit<TargetItem, 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const forecast = calculateTargetAiForecast(targetData as TargetItem);
    const newTarget: TargetItem = {
      ...targetData,
      completionRate: forecast.completionRate,
      aiForecastStatus: forecast.status,
      aiForecastProbability: forecast.probability,
      aiForecastAnalysis: forecast.analysis,
      aiSuggestedActions: forecast.suggestedActions,
      createdAt: now,
      updatedAt: now
    };
    setTargets(prev => [newTarget, ...prev]);
    saveTargetToFirestore(newTarget).catch(err => console.warn('Firestore add target error:', err));
    showToast(`Đã khởi tạo chỉ tiêu [${newTarget.code}] thành công!`, 'success');

    addSystemActivityLog({
      category: 'ACTIVITY_WORKFLOW',
      actionTitle: 'Khởi tạo Chỉ tiêu Đoàn - Hội mới',
      actionDetail: `Khởi tạo chỉ tiêu [${newTarget.code}]: "${newTarget.name}" (Mục tiêu: ${newTarget.targetValue} ${newTarget.unitOfMeasure})`,
      severity: 'success',
      performedBy: {
        userId: user.id || 'usr_current',
        userName: user.fullName || user.email,
        userEmail: user.email,
        roleName: user.currentRole.roleName,
        roleLevel: user.currentRole.roleLevel
      },
      targetEntity: {
        type: 'ACTIVITY',
        id: newTarget.id,
        name: newTarget.name
      }
    });
  };

  const updateTarget = (id: string, updates: Partial<TargetItem>) => {
    let updatedTarget: TargetItem | null = null;
    setTargets(prev => {
      const next = prev.map(t => {
        if (t.id === id) {
          const merged = { ...t, ...updates, updatedAt: new Date().toISOString() };
          const forecast = calculateTargetAiForecast(merged);
          merged.completionRate = forecast.completionRate;
          merged.aiForecastStatus = forecast.status;
          merged.aiForecastProbability = forecast.probability;
          merged.aiForecastAnalysis = forecast.analysis;
          merged.aiSuggestedActions = forecast.suggestedActions;
          updatedTarget = merged;
          return merged;
        }
        return t;
      });
      return next;
    });

    if (updatedTarget) {
      saveTargetToFirestore(updatedTarget).catch(err => console.warn('Firestore update target error:', err));
      showToast('Đã cập nhật thông tin chỉ tiêu!', 'success');

      addSystemActivityLog({
        category: 'ACTIVITY_WORKFLOW',
        actionTitle: 'Cập nhật Chỉ tiêu Đoàn - Hội',
        actionDetail: `Điều chỉnh chỉ tiêu [${(updatedTarget as TargetItem).code}]: ${(updatedTarget as TargetItem).name}`,
        severity: 'info',
        performedBy: {
          userId: user.id || 'usr_current',
          userName: user.fullName || user.email,
          userEmail: user.email,
          roleName: user.currentRole.roleName,
          roleLevel: user.currentRole.roleLevel
        }
      });
    }
  };

  const deleteTarget = (id: string) => {
    const targetToDelete = targets.find(t => t.id === id);
    setTargets(prev => prev.filter(t => t.id !== id));
    deleteTargetFromFirestore(id).catch(err => console.warn('Firestore delete target error:', err));
    showToast(`Đã xóa chỉ tiêu [${targetToDelete?.code || id}]!`, 'info');

    addSystemActivityLog({
      category: 'ACTIVITY_WORKFLOW',
      actionTitle: 'Xóa Chỉ tiêu Đoàn - Hội',
      actionDetail: `Đã xóa chỉ tiêu [${targetToDelete?.code || id}] (${targetToDelete?.name || ''})`,
      severity: 'warning',
      performedBy: {
        userId: user.id || 'usr_current',
        userName: user.fullName || user.email,
        userEmail: user.email,
        roleName: user.currentRole.roleName,
        roleLevel: user.currentRole.roleLevel
      }
    });
  };

  const toggleLockTarget = (id: string, reason?: string) => {
    let updatedTarget: TargetItem | null = null;
    setTargets(prev => {
      const next = prev.map(t => {
        if (t.id === id) {
          const newLocked = !t.isLocked;
          const merged: TargetItem = {
            ...t,
            isLocked: newLocked,
            lockedReason: newLocked ? (reason || 'Ban Thường vụ khóa định biên mức chỉ tiêu') : undefined,
            lockedBy: newLocked ? user.fullName : undefined,
            lockedAt: newLocked ? new Date().toISOString() : undefined,
            updatedAt: new Date().toISOString()
          };
          updatedTarget = merged;
          return merged;
        }
        return t;
      });
      return next;
    });

    if (updatedTarget) {
      saveTargetToFirestore(updatedTarget).catch(err => console.warn('Firestore toggle lock target error:', err));
      showToast(
        (updatedTarget as TargetItem).isLocked
          ? `Đã khóa chỉ tiêu [${(updatedTarget as TargetItem).code}]`
          : `Đã mở khóa chỉ tiêu [${(updatedTarget as TargetItem).code}]`,
        'info'
      );
    }
  };

  const allocateSubTarget = (targetId: string, allocation: TargetSubAllocation) => {
    let updatedTarget: TargetItem | null = null;
    setTargets(prev => {
      const next = prev.map(t => {
        if (t.id === targetId) {
          const existingAllocations = t.allocations || [];
          const idx = existingAllocations.findIndex(a => a.id === allocation.id || a.unitCode === allocation.unitCode);
          let newAllocations: TargetSubAllocation[];
          if (idx >= 0) {
            newAllocations = existingAllocations.map((a, i) => i === idx ? { ...a, ...allocation, updatedAt: new Date().toISOString() } : a);
          } else {
            newAllocations = [...existingAllocations, { ...allocation, id: allocation.id || `alc-${Date.now()}`, updatedAt: new Date().toISOString() }];
          }

          const totalCurrentFromUnits = newAllocations.reduce((sum, a) => sum + (a.currentValue || 0), 0);
          const completionRate = Math.min(100, Math.round(((totalCurrentFromUnits || t.currentValue) / (t.targetValue || 1)) * 1000) / 10);

          const merged: TargetItem = {
            ...t,
            allocations: newAllocations,
            allocatedUnitsCount: newAllocations.length,
            currentValue: totalCurrentFromUnits > 0 ? totalCurrentFromUnits : t.currentValue,
            completionRate,
            updatedAt: new Date().toISOString()
          };
          const forecast = calculateTargetAiForecast(merged);
          merged.aiForecastStatus = forecast.status;
          merged.aiForecastProbability = forecast.probability;
          merged.aiForecastAnalysis = forecast.analysis;
          merged.aiSuggestedActions = forecast.suggestedActions;
          updatedTarget = merged;
          return merged;
        }
        return t;
      });
      return next;
    });

    if (updatedTarget) {
      saveTargetToFirestore(updatedTarget).catch(err => console.warn('Firestore allocate target error:', err));
      showToast(`Đã phân bổ chỉ tiêu cho đơn vị [${allocation.unitName}]!`, 'success');
    }
  };

  const batchImportTargets = (importedTargets: TargetItem[]) => {
    if (!importedTargets.length) return 0;
    const now = new Date().toISOString();
    const prepared: TargetItem[] = importedTargets.map(item => {
      const forecast = calculateTargetAiForecast(item);
      return {
        ...item,
        createdAt: item.createdAt || now,
        updatedAt: now,
        completionRate: forecast.completionRate,
        aiForecastStatus: forecast.status,
        aiForecastProbability: forecast.probability,
        aiForecastAnalysis: forecast.analysis,
        aiSuggestedActions: forecast.suggestedActions
      };
    });

    setTargets(prev => {
      const existingIds = new Set(prev.map(t => t.id));
      const filteredNew = prepared.filter(p => !existingIds.has(p.id));
      const updated = prev.map(p => {
        const found = prepared.find(item => item.id === p.id);
        return found ? { ...p, ...found } : p;
      });
      return [...filteredNew, ...updated];
    });

    batchSaveTargetsToFirestore(prepared).catch(err => console.warn('Firestore batch save targets error:', err));
    showToast(`Đã nhập thành công ${prepared.length} chỉ tiêu!`, 'success');
    return prepared.length;
  };

  const restoreSampleTargets = () => {
    setTargets(INITIAL_TARGETS);
    localStorage.setItem(STORAGE_KEYS.TARGETS, JSON.stringify(INITIAL_TARGETS));
    batchSaveTargetsToFirestore(INITIAL_TARGETS).catch(err => console.warn('Firestore restore sample targets error:', err));
    showToast('Đã khôi phục bộ danh mục chỉ tiêu chuẩn NLU Youth 2026!', 'info');
  };

  // Cấp dưới đăng ký chỉ tiêu với cấp trên (Khoa / Chi đoàn / CLB lập hồ sơ đăng ký)
  const submitUnitRegistration = (targetId: string, allocationData: Partial<TargetSubAllocation>) => {
    let updatedTarget: TargetItem | null = null;
    setTargets(prev => {
      const next = prev.map(t => {
        if (t.id === targetId) {
          const existingAllocations = t.allocations || [];
          const idx = existingAllocations.findIndex(a => a.unitCode === allocationData.unitCode);
          const nowStr = new Date().toISOString();
          const newAllocEntry: TargetSubAllocation = {
            id: idx >= 0 ? existingAllocations[idx].id : `alc-${Date.now()}-${allocationData.unitCode}`,
            unitCode: allocationData.unitCode || 'UNKNOWN',
            unitName: allocationData.unitName || 'Đơn vị',
            unitType: allocationData.unitType || 'KHOA',
            targetQuota: allocationData.targetQuota || (idx >= 0 ? existingAllocations[idx].targetQuota : 0),
            registeredValue: allocationData.registeredValue !== undefined ? allocationData.registeredValue : 0,
            assignedValue: idx >= 0 ? existingAllocations[idx].assignedValue : 0,
            currentValue: idx >= 0 ? existingAllocations[idx].currentValue : 0,
            completionRate: idx >= 0 ? existingAllocations[idx].completionRate : 0,
            forecastStatus: idx >= 0 ? existingAllocations[idx].forecastStatus : 'BAO_DONG',
            registrationStatus: 'CHO_DUYET',
            isAutoAllocatedBySchool: false,
            registeredBy: user.fullName || user.email,
            registeredAt: nowStr,
            actionPlan: allocationData.actionPlan || '',
            notes: allocationData.notes || '',
            updatedAt: nowStr
          };

          let newAllocations: TargetSubAllocation[];
          if (idx >= 0) {
            newAllocations = existingAllocations.map((a, i) => i === idx ? { ...a, ...newAllocEntry } : a);
          } else {
            newAllocations = [...existingAllocations, newAllocEntry];
          }

          const unregCount = newAllocations.filter(a => a.registrationStatus === 'CHUA_DANG_KY').length;
          const merged: TargetItem = {
            ...t,
            allocations: newAllocations,
            allocatedUnitsCount: newAllocations.length,
            unregisteredUnitsCount: unregCount,
            updatedAt: nowStr
          };
          updatedTarget = merged;
          return merged;
        }
        return t;
      });
      return next;
    });

    if (updatedTarget) {
      saveTargetToFirestore(updatedTarget).catch(err => console.warn('Firestore submit registration error:', err));
      showToast(`Đơn vị [${allocationData.unitName}] đã gửi đăng ký chỉ tiêu thành công! Chờ cấp trên phê duyệt.`, 'success');
      addSystemActivityLog({
        category: 'ACTIVITY_WORKFLOW',
        actionTitle: 'Đăng ký Chỉ tiêu Cấp dưới',
        actionDetail: `Đơn vị [${allocationData.unitName}] đăng ký mức ${allocationData.registeredValue} cho chỉ tiêu [${(updatedTarget as TargetItem).code}]`,
        severity: 'info',
        performedBy: {
          userId: user.id || 'usr_current',
          userName: user.fullName || user.email,
          userEmail: user.email,
          roleName: user.currentRole.roleName,
          roleLevel: user.currentRole.roleLevel
        }
      });
    }
  };

  // Cấp trên (Cấp 4 hoặc Cấp 3) phê chuẩn mức đăng ký của đơn vị
  const approveUnitRegistration = (targetId: string, unitCode: string, approvedValue: number, note?: string) => {
    let updatedTarget: TargetItem | null = null;
    setTargets(prev => {
      const next = prev.map(t => {
        if (t.id === targetId) {
          const nowStr = new Date().toISOString();
          const newAllocations = (t.allocations || []).map(a => {
            if (a.unitCode === unitCode) {
              const compRate = approvedValue > 0 ? Math.min(100, Math.round(((a.currentValue || 0) / approvedValue) * 1000) / 10) : 0;
              return {
                ...a,
                assignedValue: approvedValue,
                registrationStatus: 'DA_DUYET' as const,
                decidedBy: user.fullName || 'Ban Thường vụ Đoàn - Hội trường',
                decidedAt: nowStr,
                decisionNote: note || 'Cấp trên phê duyệt mức chỉ tiêu giao chính thức',
                completionRate: compRate,
                updatedAt: nowStr
              };
            }
            return a;
          });

          const totalCurrent = newAllocations.reduce((sum, a) => sum + (a.currentValue || 0), 0);
          const compRate = Math.min(100, Math.round(((totalCurrent || t.currentValue) / (t.targetValue || 1)) * 1000) / 10);
          const unregCount = newAllocations.filter(a => a.registrationStatus === 'CHUA_DANG_KY').length;

          const merged: TargetItem = {
            ...t,
            allocations: newAllocations,
            allocatedUnitsCount: newAllocations.length,
            unregisteredUnitsCount: unregCount,
            currentValue: totalCurrent > 0 ? totalCurrent : t.currentValue,
            completionRate: compRate,
            updatedAt: nowStr
          };
          const forecast = calculateTargetAiForecast(merged);
          merged.aiForecastStatus = forecast.status;
          merged.aiForecastProbability = forecast.probability;
          merged.aiForecastAnalysis = forecast.analysis;
          merged.aiSuggestedActions = forecast.suggestedActions;
          updatedTarget = merged;
          return merged;
        }
        return t;
      });
      return next;
    });

    if (updatedTarget) {
      saveTargetToFirestore(updatedTarget).catch(err => console.warn('Firestore approve registration error:', err));
      showToast(`Đã phê duyệt chỉ tiêu chính thức cho đơn vị [${unitCode}]: ${approvedValue}!`, 'success');
    }
  };

  // Cấp trên từ chối hoặc yêu cầu đơn vị điều chỉnh lại mức đăng ký
  const rejectUnitRegistration = (targetId: string, unitCode: string, reason?: string) => {
    let updatedTarget: TargetItem | null = null;
    setTargets(prev => {
      const next = prev.map(t => {
        if (t.id === targetId) {
          const nowStr = new Date().toISOString();
          const newAllocations = (t.allocations || []).map(a => {
            if (a.unitCode === unitCode) {
              return {
                ...a,
                registrationStatus: 'TU_CHOI' as const,
                decidedBy: user.fullName || 'Ban Thường vụ Đoàn - Hội trường',
                decidedAt: nowStr,
                decisionNote: reason || 'Chưa đạt yêu cầu chỉ tiêu, đề nghị đơn vị điều chỉnh và đăng ký lại',
                updatedAt: nowStr
              };
            }
            return a;
          });

          const merged: TargetItem = {
            ...t,
            allocations: newAllocations,
            updatedAt: nowStr
          };
          updatedTarget = merged;
          return merged;
        }
        return t;
      });
      return next;
    });

    if (updatedTarget) {
      saveTargetToFirestore(updatedTarget).catch(err => console.warn('Firestore reject registration error:', err));
      showToast(`Đã gửi yêu cầu điều chỉnh đăng ký đến đơn vị [${unitCode}]!`, 'info');
    }
  };

  // Cấp trường (Cấp 4) là cấp quyết định cuối cùng: Nếu cấp khoa không đăng ký thì tự động phân bổ trực tiếp
  const autoAllocateUnregisteredUnits = (targetId: string, defaultQuota?: number) => {
    let updatedTarget: TargetItem | null = null;
    setTargets(prev => {
      const next = prev.map(t => {
        if (t.id === targetId) {
          const nowStr = new Date().toISOString();
          const existingAllocations = [...(t.allocations || [])];
          
          // Danh sách các Khoa thuộc trường
          const faculties = ORGANIZATIONS_LIST.filter(org => org.type === 'KHOA');
          const quotaPerUnit = defaultQuota || (t.metricType === 'PERCENTAGE' ? 100 : Math.max(1, Math.round(t.targetValue / Math.max(1, faculties.length))));

          // 1. Cập nhật các đơn vị đã có trong allocations nhưng đang ở trạng thái CHUA_DANG_KY
          const updatedAllocations = existingAllocations.map(a => {
            if (a.registrationStatus === 'CHUA_DANG_KY' || !a.registrationStatus) {
              const assigned = a.targetQuota || quotaPerUnit;
              const compRate = assigned > 0 ? Math.min(100, Math.round(((a.currentValue || 0) / assigned) * 1000) / 10) : 0;
              return {
                ...a,
                assignedValue: assigned,
                targetQuota: assigned,
                registrationStatus: 'DA_DUYET' as const,
                isAutoAllocatedBySchool: true,
                decidedBy: user.fullName || 'Cấp 4 - Ban Thường vụ Đoàn trường',
                decidedAt: nowStr,
                decisionNote: 'Cấp trường quyết định tự động phân bổ áp đặt do đơn vị chưa gửi đăng ký đúng hạn',
                completionRate: compRate,
                updatedAt: nowStr
              };
            }
            return a;
          });

          // 2. Tự động thêm các Khoa còn thiếu chưa có trong danh sách phân bổ
          const allocatedCodes = new Set(updatedAllocations.map(a => a.unitCode));
          faculties.forEach(fac => {
            if (!allocatedCodes.has(fac.code)) {
              updatedAllocations.push({
                id: `alc-auto-${Date.now()}-${fac.code}`,
                unitCode: fac.code,
                unitName: fac.name,
                unitType: 'KHOA',
                targetQuota: quotaPerUnit,
                registeredValue: 0,
                assignedValue: quotaPerUnit,
                currentValue: 0,
                completionRate: 0,
                forecastStatus: 'BAO_DONG',
                registrationStatus: 'DA_DUYET',
                isAutoAllocatedBySchool: true,
                decidedBy: user.fullName || 'Cấp 4 - Ban Thường vụ Đoàn trường',
                decidedAt: nowStr,
                decisionNote: 'Cấp trường tự động phân bổ chỉ tiêu do đơn vị chưa gửi đăng ký trước hạn chót',
                updatedAt: nowStr
              });
            }
          });

          const totalCurrent = updatedAllocations.reduce((sum, a) => sum + (a.currentValue || 0), 0);
          const compRate = Math.min(100, Math.round(((totalCurrent || t.currentValue) / (t.targetValue || 1)) * 1000) / 10);

          const merged: TargetItem = {
            ...t,
            allocations: updatedAllocations,
            allocatedUnitsCount: updatedAllocations.length,
            unregisteredUnitsCount: 0, // Đã giải quyết 100% đơn vị chưa đăng ký
            currentValue: totalCurrent > 0 ? totalCurrent : t.currentValue,
            completionRate: compRate,
            updatedAt: nowStr
          };
          const forecast = calculateTargetAiForecast(merged);
          merged.aiForecastStatus = forecast.status;
          merged.aiForecastProbability = forecast.probability;
          merged.aiForecastAnalysis = `Cấp trường đã phân bổ áp đặt định mức cho các đơn vị chưa đăng ký. ${forecast.analysis}`;
          merged.aiSuggestedActions = forecast.suggestedActions;
          updatedTarget = merged;
          return merged;
        }
        return t;
      });
      return next;
    });

    if (updatedTarget) {
      saveTargetToFirestore(updatedTarget).catch(err => console.warn('Firestore auto allocate target error:', err));
      showToast(`Đã tự động phân bổ chỉ tiêu cấp trường cho tất cả các đơn vị chưa đăng ký!`, 'success');
      addSystemActivityLog({
        category: 'ACTIVITY_WORKFLOW',
        actionTitle: 'Cấp trường Tự động Phân bổ Chỉ tiêu',
        actionDetail: `Cấp trường đã phân bổ áp đặt chỉ tiêu [${(updatedTarget as TargetItem).code}] cho toàn bộ các khoa chưa gửi đăng ký`,
        severity: 'warning',
        performedBy: {
          userId: user.id || 'usr_current',
          userName: user.fullName || user.email,
          userEmail: user.email,
          roleName: user.currentRole.roleName,
          roleLevel: user.currentRole.roleLevel
        }
      });
    }
  };

  // Tự động đối soát và liên kết hoạt động với từng mảng công tác và chỉ tiêu
  const syncTargetActivitiesFromPrograms = () => {
    let syncedCount = 0;
    setTargets(prev => {
      const next = prev.map(t => {
        // Tìm các hoạt động đã hoàn thành/được duyệt có mảng công tác trùng khớp
        const matchingActs = allActivities.filter(a => {
          if (a.isDeleted || a.deleted) return false;
          if (t.orgType === 'DOAN') {
            return (a.doanProgramId && a.doanProgramId === t.programId) || (t.linkedActivityIds || []).includes(a.id);
          } else {
            return (a.hoiProgramId && a.hoiProgramId === t.programId) || (t.linkedActivityIds || []).includes(a.id);
          }
        });

        const linkedIds = Array.from(new Set([...(t.linkedActivityIds || []), ...matchingActs.map(a => a.id)]));
        let totalProgress = t.currentValue;

        // Nếu chỉ tiêu đo lường theo số người hoặc tỷ lệ, tính tổng người tham gia từ các hoạt động liên kết
        if (matchingActs.length > 0) {
          const totalParticipants = matchingActs.reduce((sum, act) => {
            const count = (act.participants && act.participants.length > 0)
              ? act.participants.length
              : (act.officialParticipantCount || 0);
            return sum + count;
          }, 0);

          if (t.unitOfMeasure === 'Sinh viên' || t.unitOfMeasure === 'Đoàn viên' || t.unitOfMeasure === 'Lượt tham gia' || t.unitOfMeasure === 'Hội viên') {
            totalProgress = Math.max(t.currentValue, totalParticipants);
          }
        }

        const compRate = Math.min(100, Math.round((totalProgress / (t.targetValue || 1)) * 1000) / 10);
        const merged: TargetItem = {
          ...t,
          linkedActivityIds: linkedIds,
          linkedActivityCount: linkedIds.length,
          currentValue: totalProgress,
          completionRate: compRate,
          updatedAt: new Date().toISOString()
        };
        const forecast = calculateTargetAiForecast(merged);
        merged.aiForecastStatus = forecast.status;
        merged.aiForecastProbability = forecast.probability;
        merged.aiForecastAnalysis = forecast.analysis;
        merged.aiSuggestedActions = forecast.suggestedActions;
        syncedCount++;
        return merged;
      });
      batchSaveTargetsToFirestore(next).catch(err => console.warn('Firestore sync target activities error:', err));
      return next;
    });

    showToast(`Đã đồng bộ và đối soát dữ liệu hoạt động theo mảng công tác C.14 & C.13 cho ${syncedCount} chỉ tiêu!`, 'success');
  };

  const contextValue = React.useMemo(() => ({
    user,
    switchRole,
    googleUser,
    accessToken,
    isConnectingGoogle,
    loginGoogle,
    logoutGoogle,
    syncStatus,
    isInitialLoading,
    theme,
    toggleTheme,
    setTheme,
    activeTab,
    setActiveTab,
    academicYear,
    activities,
    allActivities,
    deletedActivities,
    addActivity,
    updateActivity,
    updateActivityProof,
    sendActivityRosterReminder,
    toggleLockActivity,
    reviewActivity,
    deleteActivity,
    deleteBatchActivities,
    restoreActivity,
    permanentDeleteActivity,
    uploadActivityParticipants,
    bulkImportActivities,
    students,
    allStudents,
    deletedStudents,
    addStudent,
    updateStudent,
    deleteStudent,
    deleteBatchStudents,
    restoreStudent,
    permanentDeleteStudent,
    batchUpdateStudents,
    validateActivityContributions,
    bulkImportStudents,
    restoreSampleStudents,
    restoreSampleActivities,
    checkStudentCollectionIntegrity,
    restoreStudentsFromLatestBackup,
    latestStudentBackupInfo,
    createStudentBackupSnapshot,
    autoFixUncatalogedClasses,
    checkInActivity,
    selectedPortalStudentId,
    setSelectedPortalStudentId,
    selfProofs,
    addSelfProof,
    reviewSelfProof,
    toggleSv5tCriterion,
    accounts,
    addAccount,
    batchAddAccounts,
    updateAccount,
    deleteAccount,
    toggleAccountStatus,
    organizations,
    addOrganization,
    batchAddOrganizations,
    updateOrganization,
    deleteOrganization,
    batchDeleteOrganizations,
    branchClasses,
    addBranchClass,
    batchAddBranchClasses,
    updateBranchClass,
    deleteBranchClass,
    batchDeleteBranchClasses,
    certificateTemplate,
    updateCertificateTemplate,
    issuedCertificates,
    issueCertificate,
    issueBatchCertificates,
    updateIssuedCertificate,
    deleteIssuedCertificate,
    backups,
    createSystemBackup,
    targets,
    addTarget,
    updateTarget,
    deleteTarget,
    toggleLockTarget,
    allocateSubTarget,
    batchImportTargets,
    restoreSampleTargets,
    autoAllocateUnregisteredUnits,
    approveUnitRegistration,
    rejectUnitRegistration,
    submitUnitRegistration,
    syncTargetActivitiesFromPrograms,
    drlCriteria,
    updateDrlCriteria,
    resetDrlCriteria,
    sv5tStandards,
    updateSv5tStandards,
    resetSv5tStandards,
    targetScaleConfig,
    updateTargetScaleConfig,
    resetTargetScaleConfig,
    rolePointsMatrix,
    updateRolePointsMatrix,
    doanPrograms,
    updateDoanPrograms,
    resetDoanPrograms,
    hoiPrograms,
    updateHoiPrograms,
    resetHoiPrograms,
    updateOrganizations,
    setOrganizations,
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
    scoreAuditLogs,
    addScoreAuditLog,
    studentAuditLogs,
    recordStudentAuditLog,
    systemActivityLogs,
    addSystemActivityLog,
    customNavItems,
    updateCustomNavItems,
    resetCustomNavItems,
    footerConfig,
    updateFooterConfig,
    resetFooterConfig,
    headerBranding,
    updateHeaderBranding,
    resetHeaderBranding,
    systemTerms,
    updateSystemTerms,
    resetSystemTerms,
    getTerm,
    replaceTerms,
    toasts,
    toast: toasts[0] || null,
    showToast,
    dismissToast,
    notifyNewActivity,
    notifyScoreUpdated,
    notifyBatchScoresUpdated,
    studentPushNotifications,
    sendStudentPushNotification,
    markPushNotificationAsRead,
    markAllPushNotificationsAsRead,
    clearPushNotifications,
    requestNotificationPermission
  }), [
    user, googleUser, accessToken, isConnectingGoogle, syncStatus, isInitialLoading, theme, activeTab, academicYear,
    activities, allActivities, deletedActivities, students, allStudents, deletedStudents, latestStudentBackupInfo,
    selectedPortalStudentId, selfProofs, accounts, organizations, branchClasses, certificateTemplate, issuedCertificates,
    backups, targets, drlCriteria, sv5tStandards, targetScaleConfig, rolePointsMatrix, doanPrograms, hoiPrograms,
    annualAwardsCatalog, researchAwardsCatalog, positionRolesCatalog, partyMentorCatalog, programPersonnelQuotas,
    scoreAuditLogs, studentAuditLogs, systemActivityLogs, customNavItems, footerConfig, headerBranding, systemTerms,
    toasts, studentPushNotifications
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
