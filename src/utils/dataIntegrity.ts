/**
 * NLU Youth 2026 - Data Integrity, Validation & Concurrency Control
 * Enforces business key uniqueness (MSSV, Activity ID, Org Code, Class Code),
 * non-negative scores (cumulative score has NO 100 cap), and schema validation.
 */

import {
  StudentScoreRecord,
  ActivitySubmission,
  Organization,
  BranchClass,
  AttendanceRecord,
  ParticipantRoleType,
  StudentMembership,
  StudentSelfProof
} from '../types';
import {
  calculateRankGrade,
  calculateGeneralRank,
  getPointsForRole
} from '../data/mockData';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates student score record data integrity
 */
export function validateStudentData(
  student: Partial<StudentScoreRecord>,
  existingStudents: StudentScoreRecord[],
  isNew: boolean = false
): ValidationResult {
  const errors: string[] = [];

  const studentId = student.studentId?.trim().toUpperCase();
  if (!studentId) {
    errors.push('MSSV không được để trống.');
  } else if (!/^[A-Z0-9_-]{4,20}$/.test(studentId)) {
    errors.push(`MSSV "${studentId}" không đúng định dạng (4-20 ký tự chữ và số).`);
  }

  // Duplicate check for new student
  if (isNew && studentId) {
    const isDuplicate = existingStudents.some(
      s => s.studentId?.trim().toUpperCase() === studentId && !s.deleted && !s.isDeleted
    );
    if (isDuplicate) {
      errors.push(`MSSV "${studentId}" đã tồn tại trong hệ thống.`);
    }
  }

  if (!student.fullName?.trim()) {
    errors.push('Họ và tên sinh viên không được để trống.');
  }

  if (!student.classCode?.trim()) {
    errors.push('Mã lớp sinh hoạt không được để trống.');
  }

  if (!student.facultyCode?.trim()) {
    errors.push('Mã khoa không được để trống.');
  }

  // Score non-negative checks (Điểm rèn luyện tích lũy không có mức trần 100)
  const scores = [
    { name: 'Tổng điểm rèn luyện', val: student.totalScore },
    { name: 'Điểm hoạt động', val: student.activityScore },
    { name: 'Điểm khen thưởng', val: student.bonusScore },
    { name: 'Điểm chức vụ', val: student.positionScore },
    { name: 'Điểm NCKH', val: student.researchScore }
  ];

  scores.forEach(({ name, val }) => {
    if (val !== undefined && val !== null) {
      if (typeof val !== 'number' || !Number.isFinite(val)) {
        errors.push(`${name} phải là số hợp lệ.`);
      } else if (val < 0) {
        errors.push(`${name} không được là số âm (giá trị hiện tại: ${val}).`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates youth activity data integrity
 */
export function validateActivityData(
  activity: Partial<ActivitySubmission>,
  existingActivities: ActivitySubmission[],
  isNew: boolean = false
): ValidationResult {
  const errors: string[] = [];

  const activityId = activity.id?.trim().toUpperCase();
  if (!activityId) {
    errors.push('Mã hoạt động không được để trống.');
  } else if (!/^[A-Z0-9_-]{2,30}$/.test(activityId)) {
    errors.push(`Mã hoạt động "${activityId}" không hợp lệ (2-30 ký tự chữ/số).`);
  }

  // Duplicate check for new activity
  if (isNew && activityId) {
    const isDuplicate = existingActivities.some(
      a => a.id?.trim().toUpperCase() === activityId && !a.deleted && !a.isDeleted
    );
    if (isDuplicate) {
      errors.push(`Mã hoạt động "${activityId}" đã tồn tại trong kế hoạch Đoàn - Hội.`);
    }
  }

  if (!activity.title?.trim()) {
    errors.push('Tên hoạt động Đoàn - Hội không được để trống.');
  }

  if (!activity.orgCode?.trim()) {
    errors.push('Đơn vị tổ chức không được để trống.');
  }

  const validStatuses = ['Approved', 'Pending_L3', 'Pending_L4', 'Request_Edit', 'Rejected'];
  if (activity.status && !validStatuses.includes(activity.status)) {
    errors.push(`Trạng thái phê duyệt "${activity.status}" không hợp lệ.`);
  }

  // Ràng buộc quy chế NLU: Chương trình/hoạt động do Đoàn trường, Hội Sinh viên trường tổ chức phải là chương trình Cấp 3 trở lên
  if (isSchoolYouthUnionOrAssociation(activity.orgCode, activity.orgName)) {
    if (activity.programLevel !== undefined && activity.programLevel !== null && activity.programLevel < 3) {
      errors.push(
        `Ràng buộc cấp chương trình: Hoạt động do Đoàn trường hoặc Hội Sinh viên trường tổ chức bắt buộc phải đạt xếp loại từ Cấp 3 trở lên (Cấp 3 hoặc Cấp 4). Hiện tại đang xếp Cấp ${activity.programLevel}.`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Kiểm tra xem đơn vị tổ chức có phải là Đoàn trường hoặc Hội Sinh viên trường hay không
 */
export function isSchoolYouthUnionOrAssociation(orgCode?: string, orgName?: string): boolean {
  if (!orgCode && !orgName) return false;
  const code = (orgCode || '').trim().toUpperCase();
  const name = (orgName || '').toLowerCase();
  return (
    code === 'DT' ||
    code === 'HSVT' ||
    name.includes('đoàn trường') ||
    name.includes('hội sinh viên trường')
  );
}

/**
 * Validates organization code uniqueness
 */
export function validateOrganizationCode(
  code: string,
  existingOrgs: Organization[],
  isNew: boolean = true
): ValidationResult {
  const errors: string[] = [];
  const clean = code.trim().toUpperCase();
  if (!clean) {
    errors.push('Mã đơn vị không được để trống.');
  } else if (!/^[A-Z0-9_-]{2,20}$/.test(clean)) {
    errors.push(`Mã đơn vị "${clean}" không hợp lệ (2-20 ký tự).`);
  } else if (isNew && existingOrgs.some(o => o.code?.trim().toUpperCase() === clean)) {
    errors.push(`Mã đơn vị "${clean}" đã tồn tại trong danh mục.`);
  }
  return { isValid: errors.length === 0, errors };
}

/**
 * Validates branch class code uniqueness
 */
export function validateClassCode(
  code: string,
  existingClasses: BranchClass[],
  isNew: boolean = true
): ValidationResult {
  const errors: string[] = [];
  const clean = code.trim().toUpperCase();
  if (!clean) {
    errors.push('Mã lớp không được để trống.');
  } else if (!/^[A-Z0-9_-]{3,20}$/.test(clean)) {
    errors.push(`Mã lớp "${clean}" không hợp lệ.`);
  } else if (isNew && existingClasses.some(c => c.code?.trim().toUpperCase() === clean)) {
    errors.push(`Mã lớp "${clean}" đã tồn tại trong hệ thống.`);
  }
  return { isValid: errors.length === 0, errors };
}

/**
 * Concurrency conflict detector: checks if the expected version matches the current version in database
 */
export function checkConcurrencyConflict(
  expectedVersion: number | undefined,
  currentVersion: number | undefined
): { hasConflict: boolean; message?: string } {
  if (expectedVersion === undefined || currentVersion === undefined) {
    return { hasConflict: false };
  }
  if (currentVersion > expectedVersion) {
    return {
      hasConflict: true,
      message: `Xung đột dữ liệu: Bản ghi đã được cập nhật bởi phiên khác (Phiên bản máy chủ: v${currentVersion}, phiên bản cục bộ: v${expectedVersion}). Vui lòng tải lại trước khi lưu.`
    };
  }
  return { hasConflict: false };
}


export interface ReconciliationIssue {
  type: "MISSING_ROSTER" | "MISMATCH_POINTS" | "ORPHAN_RECORD";
  attendanceId: string;
  studentId: string;
  activityId: string;
  description: string;
  suggestedFix: string;
}

export interface ReconciliationReport {
  totalRecordsChecked: number;
  missingRosterCount: number;
  mismatchPointsCount: number;
  orphanCount: number;
  issues: ReconciliationIssue[];
}

/**
 * Dry-run reconciliation tool for attendance records against activity rosters & student lists
 */
export function reconcileAttendanceRecords(
  attendanceRecords: AttendanceRecord[],
  activities: ActivitySubmission[],
  students: StudentScoreRecord[]
): ReconciliationReport {
  const issues: ReconciliationIssue[] = [];
  let missingRosterCount = 0;
  let mismatchPointsCount = 0;
  let orphanCount = 0;

  const actMap = new Map(activities.map(a => [a.id, a]));
  const stdMap = new Map(students.map(s => [s.studentId, s]));

  attendanceRecords.forEach(rec => {
    const act = actMap.get(rec.activityId);
    const std = stdMap.get(rec.studentId);

    if (!act || !std) {
      orphanCount++;
      issues.push({
        type: "ORPHAN_RECORD",
        attendanceId: rec.id,
        studentId: rec.studentId,
        activityId: rec.activityId,
        description: `Bản ghi điểm danh [${rec.id}] tham chiếu đến hoạt động hoặc sinh viên không tồn tại.`,
        suggestedFix: "Kiểm tra danh mục hoạt động/sinh viên hoặc đánh dấu bản ghi mồ côi."
      });
      return;
    }

    const roleInRec: ParticipantRoleType = rec.role || "Tham dự";
    const expectedPoints = getPointsForRole(roleInRec, act.programLevel || 1);

    if (rec.scoreAwarded !== undefined && rec.scoreAwarded !== expectedPoints) {
      mismatchPointsCount++;
      issues.push({
        type: "MISMATCH_POINTS",
        attendanceId: rec.id,
        studentId: rec.studentId,
        activityId: rec.activityId,
        description: `Điểm rèn luyện trong điểm danh (${rec.scoreAwarded}đ) khác điểm chuẩn theo quy chế (${expectedPoints}đ) cho vai trò "${roleInRec}" ở Cấp ${act.programLevel || 1}.`,
        suggestedFix: `Đồng bộ lại điểm chuẩn ${expectedPoints}đ cho bản ghi điểm danh.`
      });
    }

    const hasRoster = act.participants && act.participants.some(p => p.studentId === rec.studentId);
    if (!hasRoster) {
      missingRosterCount++;
      issues.push({
        type: "MISSING_ROSTER",
        attendanceId: rec.id,
        studentId: rec.studentId,
        activityId: rec.activityId,
        description: `Sinh viên ${rec.studentName} (${rec.studentId}) có bản ghi điểm danh nhưng chưa có trong danh sách tham gia chính thức của hoạt động "${act.title}".`,
        suggestedFix: "Bổ sung sinh viên vào danh sách tham gia chính thức của hoạt động."
      });
    }
  });

  return {
    totalRecordsChecked: attendanceRecords.length,
    missingRosterCount,
    mismatchPointsCount,
    orphanCount,
    issues
  };
}

export interface SourceActivityContributionItem {
  activityId: string;
  activityTitle: string;
  role: ParticipantRoleType;
  programLevel: number;
  pointsAwarded: number;
  attendanceStatus?: string;
  recordedAt?: string;
}

export interface StudentSourceContribution {
  studentId: string;
  sourceActivityScore: number;
  approvedActivitiesCount: number;
  contributions: SourceActivityContributionItem[];
}

/**
 * Calculates a student's total activity points and approved activity count
 * directly from source activity submissions.
 */
export function calculateStudentSourceContribution(
  studentId: string,
  activities: ActivitySubmission[]
): StudentSourceContribution {
  const cleanId = studentId?.trim().toUpperCase();
  const contributions: SourceActivityContributionItem[] = [];
  let sourceActivityScore = 0;
  let approvedActivitiesCount = 0;

  if (!cleanId || !Array.isArray(activities)) {
    return {
      studentId: cleanId || '',
      sourceActivityScore: 0,
      approvedActivitiesCount: 0,
      contributions: []
    };
  }

  activities.forEach(act => {
    if (!act || act.status !== 'Approved' || act.deleted || act.isDeleted) {
      return;
    }
    if (!Array.isArray(act.participants)) {
      return;
    }

    const participant = act.participants.find(
      p => p.studentId?.trim().toUpperCase() === cleanId
    );

    if (participant) {
      // Confirmed or default attendance status (reject Absent / Cancelled)
      const isConfirmed = participant.attendanceStatus === 'Confirmed' || !participant.attendanceStatus;
      if (isConfirmed) {
        const role: ParticipantRoleType = participant.role || 'Tham dự';
        const progLevel = act.programLevel || 1;
        const pts = typeof participant.pointsAwarded === 'number' && Number.isFinite(participant.pointsAwarded) && participant.pointsAwarded > 0
          ? participant.pointsAwarded
          : getPointsForRole(role, progLevel);

        sourceActivityScore += pts;
        approvedActivitiesCount += 1;

        contributions.push({
          activityId: act.id,
          activityTitle: act.title,
          role,
          programLevel: progLevel,
          pointsAwarded: pts,
          attendanceStatus: participant.attendanceStatus || 'Confirmed',
          recordedAt: participant.recordedAt
        });
      }
    }
  });

  return {
    studentId: cleanId,
    sourceActivityScore,
    approvedActivitiesCount,
    contributions
  };
}

export interface ScoreDiscrepancyResult {
  hasIssue: boolean;
  issueTypes: ('MATH' | 'RANK_GRADE' | 'RANK_GENERAL' | 'SOURCE_ACTIVITY')[];
  message: string;
  expectedTotal: number;
  expectedRankGrade: string;
  expectedRankGeneral: string;
  expectedActivityScore?: number;
  sourceComplete?: boolean;
}

/**
 * Checks for score math discrepancies or classification logic issues in a student record.
 * Calculates expectedRank strictly from expectedTotal and checks Number.isFinite.
 * Cross-checks activity score against source activity contributions.
 */
export function checkStudentScoreDiscrepancy(
  std: StudentScoreRecord,
  activities?: ActivitySubmission[]
): ScoreDiscrepancyResult {
  const bonus = Number.isFinite(std.bonusScore) ? Number(std.bonusScore) : 0;
  const pos = Number.isFinite(std.positionScore) ? Number(std.positionScore) : 0;
  const res = Number.isFinite(std.researchScore) ? Number(std.researchScore) : 0;
  const act = Number.isFinite(std.activityScore) ? Number(std.activityScore) : 0;
  const currentTotal = Number.isFinite(std.totalScore) ? Number(std.totalScore) : 0;
  const expectedTotal = bonus + pos + res + act;

  // Expected rank is calculated strictly from expectedTotal (not unvalidated std.totalScore)
  const expectedRankGrade = calculateRankGrade(expectedTotal, std.academicYearNumber);
  const expectedRankGeneral = calculateGeneralRank(expectedTotal);

  const mathMismatch = Math.abs(currentTotal - expectedTotal) > 0.001;
  const gradeMismatch = std.rankGrade !== expectedRankGrade;
  const generalMismatch = std.rankGeneral !== expectedRankGeneral;

  const issueTypes: ('MATH' | 'RANK_GRADE' | 'RANK_GENERAL' | 'SOURCE_ACTIVITY')[] = [];
  const details: string[] = [];

  if (mathMismatch) {
    issueTypes.push('MATH');
    details.push(`Tổng điểm hiện tại (${currentTotal}đ) khác tổng cộng dồn thực tế (${expectedTotal}đ)`);
  }
  if (gradeMismatch) {
    issueTypes.push('RANK_GRADE');
    details.push(`Xếp loại nhiệm vụ ("${std.rankGrade}") khác quy chuẩn ("${expectedRankGrade}")`);
  }
  if (generalMismatch) {
    issueTypes.push('RANK_GENERAL');
    details.push(`Xếp loại thi đua ("${std.rankGeneral}") khác quy chuẩn ("${expectedRankGeneral}")`);
  }

  let expectedActivityScore: number | undefined;
  let sourceComplete = false;
  if (activities !== undefined && Array.isArray(activities)) {
    sourceComplete = true;
    const source = calculateStudentSourceContribution(std.studentId, activities);
    expectedActivityScore = source.sourceActivityScore;
    if (Math.abs(act - expectedActivityScore) > 0.001) {
      issueTypes.push('SOURCE_ACTIVITY');
      details.push(`Điểm hoạt động (${act}đ) khác tổng nguồn minh chứng hoạt động (${expectedActivityScore}đ)`);
    }
  }

  return {
    hasIssue: issueTypes.length > 0,
    issueTypes,
    message: details.length > 0 ? details.join(' • ') : '',
    expectedTotal,
    expectedRankGrade,
    expectedRankGeneral,
    expectedActivityScore,
    sourceComplete
  };
}

export interface ContributionValidationMismatch {
  studentId: string;
  fullName: string;
  classCode: string;
  facultyCode: string;
  issueTypes: ('SCORE_MISMATCH' | 'COUNT_MISMATCH' | 'RANK_MISMATCH' | 'MATH_SUM_MISMATCH')[];
  recordedActivityScore: number;
  expectedActivityScore: number;
  recordedApprovedCount: number;
  expectedApprovedCount: number;
  recordedTotalScore: number;
  expectedTotalScore: number;
  recordedRankGrade: string;
  expectedRankGrade: string;
  message: string;
}

export interface ActivityContributionValidationReport {
  totalStudentsChecked: number;
  validStudentsCount: number;
  discrepantStudentsCount: number;
  mismatches: ContributionValidationMismatch[];
  summary: {
    scoreMismatches: number;
    countMismatches: number;
    rankMismatches: number;
    mathSumMismatches: number;
  };
}

/**
 * Validates student records against source activity submissions.
 * Performs validation checks between activity contributions and student records,
 * returning detailed mismatch diagnostics.
 */
export function validateActivityContributionsAgainstStudents(
  students: StudentScoreRecord[],
  activities: ActivitySubmission[]
): ActivityContributionValidationReport {
  const mismatches: ContributionValidationMismatch[] = [];
  let scoreMismatches = 0;
  let countMismatches = 0;
  let rankMismatches = 0;
  let mathSumMismatches = 0;

  const validStudents = Array.isArray(students)
    ? students.filter(s => !s.deleted && !s.isDeleted)
    : [];

  validStudents.forEach(std => {
    const source = calculateStudentSourceContribution(std.studentId, activities);

    const bonus = Number.isFinite(std.bonusScore) ? Number(std.bonusScore) : 0;
    const pos = Number.isFinite(std.positionScore) ? Number(std.positionScore) : 0;
    const res = Number.isFinite(std.researchScore) ? Number(std.researchScore) : 0;
    const recordedAct = Number.isFinite(std.activityScore) ? Number(std.activityScore) : 0;
    const recordedTotal = Number.isFinite(std.totalScore) ? Number(std.totalScore) : 0;
    const recordedCount = Number.isFinite(std.approvedActivitiesCount) ? Number(std.approvedActivitiesCount) : 0;

    const expectedAct = source.sourceActivityScore;
    const expectedCount = source.approvedActivitiesCount;
    const expectedTotal = bonus + pos + res + expectedAct;
    const expectedRankGrade = calculateRankGrade(expectedTotal, std.academicYearNumber);

    const isScoreMismatch = Math.abs(recordedAct - expectedAct) > 0.001;
    const isCountMismatch = recordedCount !== expectedCount;
    const isMathMismatch = Math.abs(recordedTotal - expectedTotal) > 0.001;
    const isRankMismatch = std.rankGrade !== expectedRankGrade;

    if (isScoreMismatch || isCountMismatch || isMathMismatch || isRankMismatch) {
      const issueTypes: ('SCORE_MISMATCH' | 'COUNT_MISMATCH' | 'RANK_MISMATCH' | 'MATH_SUM_MISMATCH')[] = [];
      const messages: string[] = [];

      if (isScoreMismatch) {
        issueTypes.push('SCORE_MISMATCH');
        scoreMismatches++;
        messages.push(`Điểm HĐ ghi nhận (${recordedAct}đ) khác tổng minh chứng thực tế (${expectedAct}đ)`);
      }
      if (isCountMismatch) {
        issueTypes.push('COUNT_MISMATCH');
        countMismatches++;
        messages.push(`Số HĐ (${recordedCount}) khác số tham gia được duyệt (${expectedCount})`);
      }
      if (isMathMismatch) {
        issueTypes.push('MATH_SUM_MISMATCH');
        mathSumMismatches++;
        messages.push(`Tổng điểm (${recordedTotal}đ) khác tổng nguồn chuẩn (${expectedTotal}đ)`);
      }
      if (isRankMismatch) {
        issueTypes.push('RANK_MISMATCH');
        rankMismatches++;
        messages.push(`Xếp loại ("${std.rankGrade}") khác quy chuẩn ("${expectedRankGrade}")`);
      }

      mismatches.push({
        studentId: std.studentId,
        fullName: std.fullName,
        classCode: std.classCode,
        facultyCode: std.facultyCode,
        issueTypes,
        recordedActivityScore: recordedAct,
        expectedActivityScore: expectedAct,
        recordedApprovedCount: recordedCount,
        expectedApprovedCount: expectedCount,
        recordedTotalScore: recordedTotal,
        expectedTotalScore: expectedTotal,
        recordedRankGrade: std.rankGrade || '',
        expectedRankGrade,
        message: messages.join(' • ')
      });
    }
  });

  return {
    totalStudentsChecked: validStudents.length,
    validStudentsCount: validStudents.length - mismatches.length,
    discrepantStudentsCount: mismatches.length,
    mismatches,
    summary: {
      scoreMismatches,
      countMismatches,
      rankMismatches,
      mathSumMismatches
    }
  };
}

/**
 * Reconstructs a single student's totals and scores directly from source activity contributions.
 * Does NOT apply any artificial 100-point cap.
 */
export function reconstructStudentTotalsFromSource(
  student: StudentScoreRecord,
  activities: ActivitySubmission[],
  options?: {
    bonusAdd?: number;
    membershipType?: StudentMembership;
    academicYearNumber?: number;
    clubCode?: string;
    clubCodes?: string[];
    selfProofs?: StudentSelfProof[];
  }
): StudentScoreRecord {
  const source = calculateStudentSourceContribution(student.studentId, activities);

  let bonusScore = Number.isFinite(student.bonusScore) ? Number(student.bonusScore) : 0;
  if (options?.bonusAdd !== undefined && Number.isFinite(options.bonusAdd)) {
    bonusScore = Math.max(0, bonusScore + options.bonusAdd);
  }

  let positionScore = Number.isFinite(student.positionScore) ? Number(student.positionScore) : 0;
  let researchScore = Number.isFinite(student.researchScore) ? Number(student.researchScore) : 0;

  // Nếu có danh sách minh chứng: Quy chế NLU thêm được nhiều minh chứng nhưng chỉ tính điểm cao nhất trong mỗi nhóm
  if (options?.selfProofs && Array.isArray(options.selfProofs)) {
    const studentProofs = options.selfProofs.filter(
      p => p.studentId === student.studentId && p.status === 'Approved'
    );
    const maxKhenThuong = Math.max(0, ...studentProofs.filter(p => p.type === 'KHEN_THUONG').map(p => p.approvedScore ?? p.scoreClaimed ?? 0));
    const maxChucVu = Math.max(0, ...studentProofs.filter(p => p.type === 'CHUC_VU').map(p => p.approvedScore ?? p.scoreClaimed ?? 0));
    const maxNckh = Math.max(0, ...studentProofs.filter(p => p.type === 'NCKH').map(p => p.approvedScore ?? p.scoreClaimed ?? 0));
    const maxParty = Math.max(0, ...studentProofs.filter(p => p.type === 'DANG_VIEN_HUONG_DAN').map(p => p.approvedScore ?? p.scoreClaimed ?? 0));

    if (maxKhenThuong > 0 || maxParty > 0) {
      bonusScore = Math.max(bonusScore, maxKhenThuong, maxParty);
    }
    if (maxChucVu > 0) {
      positionScore = Math.max(positionScore, maxChucVu);
    }
    if (maxNckh > 0) {
      researchScore = Math.max(researchScore, maxNckh);
    }
  }

  const activityScore = source.sourceActivityScore;
  const approvedActivitiesCount = source.approvedActivitiesCount;

  // Cumulative total without 100-cap
  const totalScore = Math.max(0, bonusScore + positionScore + researchScore + activityScore);

  const academicYearNumber = options?.academicYearNumber !== undefined
    ? options.academicYearNumber
    : student.academicYearNumber;

  const membershipType = options?.membershipType || student.membershipType;

  const rankGrade = calculateRankGrade(totalScore, academicYearNumber);
  const rankGeneral = calculateGeneralRank(totalScore);

  let clubCodes = options?.clubCodes || student.clubCodes || [];
  let clubCode = options?.clubCode || student.clubCode;
  let clubName = student.clubName;
  let clubCategory = student.clubCategory;

  if (options?.clubCode) {
    clubCode = options.clubCode;
    clubCodes = Array.from(new Set([...clubCodes, options.clubCode]));
  }

  return {
    ...student,
    bonusScore,
    positionScore,
    researchScore,
    activityScore,
    approvedActivitiesCount,
    totalScore,
    membershipType,
    academicYearNumber,
    rankGrade,
    rankGeneral,
    clubCode,
    clubCodes,
    clubName,
    clubCategory
  };
}

/**
 * Reconstructs all students' totals and scores from source activity contributions.
 */
export function reconstructAllStudentsFromSource(
  students: StudentScoreRecord[],
  activities: ActivitySubmission[]
): StudentScoreRecord[] {
  return students.map(std => {
    if (std.deleted || std.isDeleted) return std;
    return reconstructStudentTotalsFromSource(std, activities);
  });
}

// ============================================================================
// STUDENT COLLECTION INTEGRITY & DATA LOSS PREVENTION (BẢO TOÀN DỮ LIỆU SINH VIÊN)
// ============================================================================

export interface StudentIntegrityIssue {
  id: string;
  type:
    | 'CRITICAL_MISSING_FIELD'
    | 'DUPLICATE_MSSV'
    | 'INVALID_SCORE'
    | 'ORPHAN_ORG'
    | 'ORPHAN_CLASS'
    | 'MALFORMED_MSSV'
    | 'DATA_LOSS_DROP';
  severity: 'error' | 'warning' | 'info';
  studentId: string;
  fullName?: string;
  description: string;
  suggestedFix: string;
}

export interface StudentCollectionIntegrityReport {
  timestamp: string;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  totalChecked: number;
  activeCount: number;
  softDeletedCount: number;
  validCount: number;
  issuesCount: number;
  duplicateCount: number;
  missingFieldCount: number;
  scoreAnomalyCount: number;
  orphanOrgCount: number;
  orphanClassCount: number;
  issues: StudentIntegrityIssue[];
  cachedSnapshotCount?: number;
  dataLossRisk: boolean;
  dataLossMessage?: string;
  recommendations: string[];
}

/**
 * Tự động kiểm tra tính toàn vẹn của collection sinh viên
 * Phát hiện mất mát dữ liệu, trùng lặp MSSV, thiếu trường bắt buộc, điểm bất thường
 */
export function validateStudentCollectionIntegrity(
  students: StudentScoreRecord[],
  organizations?: Organization[],
  branchClasses?: BranchClass[],
  cachedSnapshotCount?: number
): StudentCollectionIntegrityReport {
  const issues: StudentIntegrityIssue[] = [];
  const list = Array.isArray(students) ? students : [];
  const activeStudents = list.filter(s => !s.deleted && !s.isDeleted);
  const softDeletedCount = list.length - activeStudents.length;

  let duplicateCount = 0;
  let missingFieldCount = 0;
  let scoreAnomalyCount = 0;
  let orphanOrgCount = 0;
  let orphanClassCount = 0;

  // 1. Kiểm tra nguy cơ mất mát dữ liệu toàn cục (Data Loss Risk)
  let dataLossRisk = false;
  let dataLossMessage: string | undefined;

  if (activeStudents.length === 0) {
    dataLossRisk = true;
    dataLossMessage = 'CẢNH BÁO BÁO ĐỘNG: Danh mục sinh viên đang hoàn toàn trống rỗng (0 sinh viên)! Có nguy cơ mất mát toàn bộ dữ liệu.';
    issues.push({
      id: 'issue_empty_collection',
      type: 'DATA_LOSS_DROP',
      severity: 'error',
      studentId: 'SYSTEM',
      fullName: 'Hệ thống',
      description: 'Collection sinh viên không có bất kỳ hồ sơ nào trong bộ nhớ/cơ sở dữ liệu.',
      suggestedFix: 'Nhấn nút "Khôi phục từ bản sao lưu gần nhất" để phục hồi toàn bộ hồ sơ sinh viên ngay lập tức.'
    });
  } else if (cachedSnapshotCount && cachedSnapshotCount > 0 && activeStudents.length < cachedSnapshotCount * 0.7) {
    dataLossRisk = true;
    const dropDiff = cachedSnapshotCount - activeStudents.length;
    dataLossMessage = `CẢNH BÁO MẤT DỮ LIỆU: Số lượng sinh viên hiện tại (${activeStudents.length}) thấp hơn đáng kể so với bản sao lưu gần nhất (${cachedSnapshotCount} hồ sơ, giảm ${dropDiff} sinh viên).`;
    issues.push({
      id: 'issue_anomalous_drop',
      type: 'DATA_LOSS_DROP',
      severity: 'error',
      studentId: 'SYSTEM',
      fullName: 'Hệ thống',
      description: dataLossMessage,
      suggestedFix: 'Khôi phục từ bản sao lưu gần nhất để bù đắp các hồ sơ bị xóa nhầm hoặc thất lạc.'
    });
  }

  // Set tổ chức và lớp có sẵn
  const orgCodes = new Set(
    (organizations || []).map(o => String(o.code || '').trim().toUpperCase()).filter(Boolean)
  );
  const classCodes = new Set(
    (branchClasses || []).map(c => String(c.code || '').trim().toUpperCase()).filter(Boolean)
  );

  // 2. Kiểm tra trùng lặp MSSV
  const mssvCountMap = new Map<string, StudentScoreRecord[]>();
  activeStudents.forEach(std => {
    const rawId = String(std.studentId || '').trim().toUpperCase();
    if (rawId) {
      const existing = mssvCountMap.get(rawId) || [];
      existing.push(std);
      mssvCountMap.set(rawId, existing);
    }
  });

  mssvCountMap.forEach((matched, mssv) => {
    if (matched.length > 1) {
      duplicateCount += (matched.length - 1);
      issues.push({
        id: `dup_${mssv}`,
        type: 'DUPLICATE_MSSV',
        severity: 'error',
        studentId: mssv,
        fullName: matched.map(m => m.fullName).join(', '),
        description: `MSSV "${mssv}" bị trùng lặp ${matched.length} lần trong danh mục.`,
        suggestedFix: 'Hợp nhất dữ liệu hoặc giữ lại hồ sơ đầy đủ điểm nhất.'
      });
    }
  });

  // 3. Kiểm tra từng hồ sơ sinh viên
  activeStudents.forEach((std, idx) => {
    const mssv = String(std.studentId || '').trim();
    const fullName = String(std.fullName || '').trim();
    const classCode = String(std.classCode || '').trim().toUpperCase();
    const facultyCode = String(std.facultyCode || '').trim().toUpperCase();

    // 3a. Thiếu trường bắt buộc
    const missing: string[] = [];
    if (!mssv) missing.push('MSSV');
    if (!fullName) missing.push('Họ và tên');
    if (!classCode) missing.push('Mã chi đoàn/lớp');
    if (!facultyCode) missing.push('Mã khoa');

    if (missing.length > 0) {
      missingFieldCount++;
      issues.push({
        id: `missing_${mssv || idx}`,
        type: 'CRITICAL_MISSING_FIELD',
        severity: 'error',
        studentId: mssv || `STT_${idx + 1}`,
        fullName: fullName || '(Chưa nhập tên)',
        description: `Hồ sơ thiếu các thông tin cốt lõi: ${missing.join(', ')}.`,
        suggestedFix: 'Bổ sung đầy đủ các trường thông tin bắt buộc hoặc khôi phục từ bản sao lưu.'
      });
    }

    // 3b. Định dạng MSSV
    if (mssv && (mssv.length < 4 || mssv.length > 20)) {
      issues.push({
        id: `malformed_${mssv}`,
        type: 'MALFORMED_MSSV',
        severity: 'warning',
        studentId: mssv,
        fullName,
        description: `MSSV "${mssv}" có độ dài bất thường (${mssv.length} ký tự).`,
        suggestedFix: 'Kiểm tra lại định dạng MSSV theo chuẩn ĐH Nông Lâm.'
      });
    }

    // 3c. Kiểm tra điểm rèn luyện & thành phần điểm âm hoặc NaN
    const checkScores = [
      { name: 'Tổng điểm', val: std.totalScore },
      { name: 'Điểm hoạt động', val: std.activityScore },
      { name: 'Điểm thưởng', val: std.bonusScore },
      { name: 'Điểm chức vụ', val: std.positionScore },
      { name: 'Điểm NCKH', val: std.researchScore }
    ];

    let hasBadScore = false;
    checkScores.forEach(({ name, val }) => {
      if (val !== undefined && val !== null) {
        if (!Number.isFinite(val) || val < 0) {
          hasBadScore = true;
          issues.push({
            id: `score_${mssv}_${name}`,
            type: 'INVALID_SCORE',
            severity: 'error',
            studentId: mssv,
            fullName,
            description: `${name} không hợp lệ hoặc là số âm: ${val}.`,
            suggestedFix: 'Quy chuẩn điểm rèn luyện phải >= 0 và là số hợp lệ.'
          });
        }
      }
    });
    if (hasBadScore) scoreAnomalyCount++;

    // 3d. Kiểm tra liên kết Khoa / Chi đoàn
    if (facultyCode && orgCodes.size > 0 && !orgCodes.has(facultyCode)) {
      orphanOrgCount++;
      issues.push({
        id: `orphan_org_${mssv}`,
        type: 'ORPHAN_ORG',
        severity: 'warning',
        studentId: mssv,
        fullName,
        description: `Mã khoa "${facultyCode}" chưa tồn tại trong danh mục Đơn vị Đoàn - Hội.`,
        suggestedFix: `Đăng ký mã khoa "${facultyCode}" trong phân hệ Đơn vị hoặc cập nhật lại mã khoa của sinh viên.`
      });
    }

    if (classCode && classCodes.size > 0 && !classCodes.has(classCode)) {
      orphanClassCount++;
      issues.push({
        id: `orphan_class_${mssv}`,
        type: 'ORPHAN_CLASS',
        severity: 'info',
        studentId: mssv,
        fullName,
        description: `Mã chi đoàn "${classCode}" chưa được khai báo trong danh mục Lớp/Chi đoàn.`,
        suggestedFix: `Thêm chi đoàn "${classCode}" vào danh mục Chi đoàn để quản lý đồng bộ.`
      });
    }
  });

  // Tính toán trạng thái tổng thể
  let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
  if (dataLossRisk || duplicateCount > 0 || missingFieldCount > 0 || scoreAnomalyCount > 0) {
    status = 'CRITICAL';
  } else if (issues.length > 0) {
    status = 'WARNING';
  }

  // Các khuyến nghị
  const recommendations: string[] = [];
  if (dataLossRisk) {
    recommendations.push('Ưu tiên cao nhất: Bấm "Khôi phục từ bản sao lưu gần nhất" để tái lập đầy đủ danh mục sinh viên.');
  }
  if (duplicateCount > 0) {
    recommendations.push(`Cần xử lý ${duplicateCount} trường hợp trùng lặp MSSV để tránh xung đột điểm rèn luyện.`);
  }
  if (missingFieldCount > 0) {
    recommendations.push(`Có ${missingFieldCount} sinh viên thiếu thông tin bắt buộc, cần cập nhật bổ sung.`);
  }
  if (scoreAnomalyCount > 0) {
    recommendations.push(`Có ${scoreAnomalyCount} sinh viên có điểm số bất thường, cần chuẩn hóa điểm.`);
  }
  if (status === 'HEALTHY') {
    recommendations.push('Toàn bộ collection sinh viên đạt tính toàn vẹn 100%. Dữ liệu an toàn và đã được đồng bộ chuẩn hóa.');
  }

  const validCount = Math.max(0, activeStudents.length - (missingFieldCount + scoreAnomalyCount));

  return {
    timestamp: new Date().toLocaleString('vi-VN'),
    status,
    totalChecked: list.length,
    activeCount: activeStudents.length,
    softDeletedCount,
    validCount,
    issuesCount: issues.length,
    duplicateCount,
    missingFieldCount,
    scoreAnomalyCount,
    orphanOrgCount,
    orphanClassCount,
    issues,
    cachedSnapshotCount,
    dataLossRisk,
    dataLossMessage,
    recommendations
  };
}
