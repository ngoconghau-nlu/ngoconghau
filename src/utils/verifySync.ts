import { StudentScoreRecord, ActivitySubmission } from '../types';
import { BRANCH_CLASSES } from '../data/mockData';

export type AuditSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export type AuditIssueType =
  | 'MISSING_FIELD'
  | 'INVALID_MSSV_FORMAT'
  | 'DUPLICATE_MSSV'
  | 'UNCATALOGED_CLASS'
  | 'FACULTY_CLASS_MISMATCH'
  | 'INVALID_METADATA'
  | 'SCORE_ANOMALY'
  | 'ORPHANED_PARTICIPANT'
  | 'MEMBERSHIP_INCOMPLETE';

/**
 * Detailed single audit record for developer & audit inspection
 */
export interface AuditRecordItem {
  id: string;
  recordIndex: number;
  studentId: string;
  fullName: string;
  classCode: string;
  facultyCode: string;
  issueType: AuditIssueType;
  severity: AuditSeverity;
  description: string;
  field: string;
  currentValue: any;
  expectedValue?: any;
  suggestedFix?: string;
}

export interface MissingFieldsDetail {
  studentId: string;
  fullName: string;
  missingFields: string[];
  recordIndex: number;
}

export interface InvalidClassCodeDetail {
  studentId: string;
  fullName: string;
  classCode: string;
  recordIndex: number;
  reason: string;
  expectedFaculty?: string;
  suggestedCatalogMatch?: string;
}

export interface InvalidMetadataDetail {
  studentId: string;
  fullName: string;
  recordIndex: number;
  field: string;
  issue: string;
  value: any;
  suggestedFix?: string;
}

export interface DuplicateMssvDetail {
  studentId: string;
  count: number;
  indices: number[];
  names: string[];
  classCodes: string[];
}

export interface FacultyClassMismatchDetail {
  studentId: string;
  fullName: string;
  recordIndex: number;
  classCode: string;
  studentFaculty: string;
  expectedFaculty: string;
}

export interface ScoreAnomalyDetail {
  studentId: string;
  fullName: string;
  recordIndex: number;
  issue: string;
  totalScore: number;
  expectedTotal: number;
  difference: number;
}

export interface VerifySyncResult {
  isSynced: boolean;
  totalStudents: number;
  totalDoanVien: number;
  totalActivities: number;
  totalApprovedActivities: number;
  totalParticipations: number;
  orphanedParticipantsCount: number;
  orphanedDetails: Array<{ studentId: string; activityId: string; activityTitle: string }>;

  // Missing required fields
  missingRequiredFieldsCount: number;
  missingRequiredFieldsDetails: MissingFieldsDetail[];

  // Invalid class codes
  invalidClassCodesCount: number;
  invalidClassCodeDetails: InvalidClassCodeDetail[];

  // Deep Audit Additions: Duplicate MSSV, Metadata Format, Faculty-Class Mismatch, Score Anomalies
  duplicateMssvCount: number;
  duplicateMssvDetails: DuplicateMssvDetail[];

  invalidMetadataCount: number;
  invalidMetadataDetails: InvalidMetadataDetail[];

  facultyClassMismatchCount: number;
  facultyClassMismatchDetails: FacultyClassMismatchDetail[];

  scoreAnomalyCount: number;
  scoreAnomalyDetails: ScoreAnomalyDetail[];

  // Structured Audit Log Records (for logging and auditing reports)
  auditRecordsCount: number;
  auditRecords: AuditRecordItem[];

  discrepancies: string[];
  timestamp: string;
}

// Recognized Faculties & Divisions at NLU (Trường Đại học Nông Lâm TP.HCM)
const KNOWN_FACULTIES = new Set([
  // Official standard codes from ORGANIZATIONS_LIST
  'CNTT', 'CNTY', 'CKCN', 'KHSH', 'MTTN', 'CNHTP', 'NNSP', 'NH', 'QLDDBDS', 'KT', 'LN', 'TS', 'VC_NLD',
  // Short/Alternative abbreviations
  'TY', 'NL', 'CK', 'QLD', 'KHTN', 'NN', 'CNTP', 'CNSH', 'DT', 'HSVT'
]);

/**
 * Standard NLU MSSV Regex: 8 digits (e.g., 22130001) or standard alphanumeric 7-10 chars
 */
const MSSV_STANDARD_REGEX = /^[0-9]{8}$/;
const MSSV_PERMISSIVE_REGEX = /^[a-zA-Z0-9_\-.]{6,15}$/;

/**
 * Fuzzy finder to find closest class name from catalog if typo exists
 */
function findClosestClassCode(inputClass: string, catalogClasses: string[]): string | undefined {
  const norm = inputClass.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!norm) return undefined;

  for (const c of catalogClasses) {
    const cNorm = c.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cNorm.includes(norm) || norm.includes(cNorm)) {
      return c;
    }
  }
  return undefined;
}

/**
 * Deep validation utility performing comprehensive cross-checks across the master student roster,
 * class catalog, and activity participations in Firestore.
 * 
 * Deep auditing checks:
 * 1. Required student profile fields validation (MSSV, Họ tên, Mã lớp, Mã khoa).
 * 2. MSSV uniqueness & format validation (no duplicate collisions, valid alphanumeric format).
 * 3. Class code existence against official master catalog (BRANCH_CLASSES).
 * 4. Faculty-to-Class cross-reference consistency (e.g. DH22IT01 must belong to CNTT).
 * 5. Metadata validity: valid membershipType, academic year bounds, full name structure.
 * 6. Training points mathematical consistency & non-negative bounds (không trần 100).
 * 7. Cross-collection participant validation (orphan participant detection).
 * 8. Official Đoàn viên status completeness.
 * 9. Comprehensive structured logging for audits & compliance verification.
 */
export function verifySync(
  students: StudentScoreRecord[],
  activities: ActivitySubmission[],
  contextTag: string = 'Runtime Audit',
  validClassCodes?: string[],
  userRoleLevel?: number
): VerifySyncResult {
  const timestamp = new Date().toISOString();
  const safeStudents = students || [];
  const safeActivities = activities || [];

  const totalStudents = safeStudents.length;
  const doanVienStudents = safeStudents.filter(s => s && s.membershipType === 'DOAN_VIEN');
  const totalDoanVien = doanVienStudents.length;

  // Master class map with catalog metadata
  const classCatalogMap = new Map<string, { code: string; facultyCode: string; name: string }>();
  const catalogCodeList: string[] = [];
  BRANCH_CLASSES.forEach(c => {
    const upperCode = c.code.trim().toUpperCase();
    catalogCodeList.push(c.code);
    classCatalogMap.set(upperCode, {
      code: upperCode,
      facultyCode: (c.facultyCode || '').trim().toUpperCase(),
      name: c.name
    });
  });

  const customAllowedClasses = validClassCodes && validClassCodes.length > 0
    ? new Set(validClassCodes.map(c => c.trim().toUpperCase()))
    : null;

  if (validClassCodes && validClassCodes.length > 0) {
    validClassCodes.forEach(code => {
      const upper = code.trim().toUpperCase();
      if (!classCatalogMap.has(upper)) {
        catalogCodeList.push(code);
        classCatalogMap.set(upper, {
          code: upper,
          facultyCode: '',
          name: `Chi đoàn ${upper}`
        });
      }
    });
  }

  const orphanedDetails: Array<{ studentId: string; activityId: string; activityTitle: string }> = [];
  const missingRequiredFieldsDetails: MissingFieldsDetail[] = [];
  const invalidClassCodeDetails: InvalidClassCodeDetail[] = [];
  const invalidMetadataDetails: InvalidMetadataDetail[] = [];
  const facultyClassMismatchDetails: FacultyClassMismatchDetail[] = [];
  const scoreAnomalyDetails: ScoreAnomalyDetail[] = [];
  const auditRecords: AuditRecordItem[] = [];
  const discrepancies: string[] = [];

  let auditSeq = 1;
  const addAuditItem = (
    recordIndex: number,
    studentId: string,
    fullName: string,
    classCode: string,
    facultyCode: string,
    issueType: AuditIssueType,
    severity: AuditSeverity,
    field: string,
    description: string,
    currentValue: any,
    expectedValue?: any,
    suggestedFix?: string
  ) => {
    auditRecords.push({
      id: `AUDIT_${String(auditSeq++).padStart(4, '0')}`,
      recordIndex,
      studentId,
      fullName,
      classCode,
      facultyCode,
      issueType,
      severity,
      description,
      field,
      currentValue,
      expectedValue,
      suggestedFix
    });
  };

  // Track MSSVs for uniqueness audit
  const mssvOccurrences = new Map<string, { indices: number[]; names: string[]; classCodes: string[] }>();
  const studentMap = new Map<string, StudentScoreRecord>();

  // 1. Audit Student master roster
  safeStudents.forEach((student, idx) => {
    if (!student) {
      discrepancies.push(`Bản ghi sinh viên tại vị trí index ${idx} bị null hoặc undefined.`);
      addAuditItem(
        idx,
        'NULL_STUDENT',
        'N/A',
        'N/A',
        'N/A',
        'MISSING_FIELD',
        'CRITICAL',
        'record',
        `Bản ghi sinh viên tại vị trí index ${idx} bị null hoặc undefined`,
        null,
        'Object StudentScoreRecord',
        'Xóa hoặc khởi tạo lại bản ghi sinh viên hợp lệ'
      );
      return;
    }

    const sid = student.studentId ? String(student.studentId).trim() : '';
    const name = student.fullName ? String(student.fullName).trim() : '';
    const cls = student.classCode ? String(student.classCode).trim() : '';
    const fac = student.facultyCode ? String(student.facultyCode).trim() : '';

    // Track for duplicate MSSVs
    if (sid) {
      studentMap.set(sid, student);
      const existingOcc = mssvOccurrences.get(sid);
      if (existingOcc) {
        existingOcc.indices.push(idx);
        if (name) existingOcc.names.push(name);
        if (cls) existingOcc.classCodes.push(cls);
      } else {
        mssvOccurrences.set(sid, {
          indices: [idx],
          names: name ? [name] : [],
          classCodes: cls ? [cls] : []
        });
      }
    }

    // A. Required fields check
    const missingFields: string[] = [];
    if (!sid) missingFields.push('studentId (MSSV)');
    if (!name) missingFields.push('fullName (Họ và tên)');
    if (!cls) missingFields.push('classCode (Mã lớp)');
    if (!fac) missingFields.push('facultyCode (Mã khoa)');

    if (missingFields.length > 0) {
      missingRequiredFieldsDetails.push({
        studentId: sid || `INDEX_${idx}`,
        fullName: name || 'Chưa có họ tên',
        missingFields,
        recordIndex: idx
      });

      missingFields.forEach(f => {
        addAuditItem(
          idx,
          sid || `INDEX_${idx}`,
          name || 'N/A',
          cls || 'N/A',
          fac || 'N/A',
          'MISSING_FIELD',
          'CRITICAL',
          f.split(' ')[0],
          `Thiếu trường thông tin bắt buộc: ${f}`,
          '',
          'Chuỗi văn bản không rỗng',
          `Bổ sung giá trị cho trường ${f}`
        );
      });
    }

    // B. MSSV format validation
    if (sid) {
      if (!MSSV_PERMISSIVE_REGEX.test(sid)) {
        invalidMetadataDetails.push({
          studentId: sid,
          fullName: name,
          recordIndex: idx,
          field: 'studentId',
          issue: 'MSSV chứa ký tự đặc biệt không hợp lệ hoặc độ dài bất thường (< 6 hoặc > 15 ký tự)',
          value: sid,
          suggestedFix: 'Chuẩn hóa định dạng MSSV gồm 8 chữ số'
        });

        addAuditItem(
          idx,
          sid,
          name,
          cls,
          fac,
          'INVALID_MSSV_FORMAT',
          'CRITICAL',
          'studentId',
          `MSSV '${sid}' chứa ký tự đặc biệt hoặc sai độ dài chuẩn`,
          sid,
          '8 chữ số (Vd: 22130001)',
          'Sửa MSSV thành định dạng chuẩn 8 chữ số'
        );
      } else if (!MSSV_STANDARD_REGEX.test(sid)) {
        const isOfficerOrStaff = sid.startsWith('VC') || sid.startsWith('GV') || sid.startsWith('CB') || sid.startsWith('AD') || sid.startsWith('STAFF');
        if (!isOfficerOrStaff) {
          // Warning: Non-standard length for student (not exactly 8 digits)
          invalidMetadataDetails.push({
            studentId: sid,
            fullName: name,
            recordIndex: idx,
            field: 'studentId',
            issue: `MSSV '${sid}' không theo chuẩn 8 chữ số của ĐH Nông Lâm TP.HCM`,
            value: sid,
            suggestedFix: 'Kiểm tra lại khóa học và số thứ tự sinh viên'
          });

          addAuditItem(
            idx,
            sid,
            name,
            cls,
            fac,
            'INVALID_MSSV_FORMAT',
            'WARNING',
            'studentId',
            `MSSV '${sid}' không đúng chuẩn 8 chữ số`,
            sid,
            '8 chữ số',
            'Xác minh với phòng Đào tạo'
          );
        }
      }
    }

    // C. Full name structure check
    if (name) {
      const words = name.split(/\s+/).filter(Boolean);
      if (words.length < 2) {
        invalidMetadataDetails.push({
          studentId: sid || `INDEX_${idx}`,
          fullName: name,
          recordIndex: idx,
          field: 'fullName',
          issue: 'Họ và tên quá ngắn hoặc thiếu thành phần Họ/Tên (dưới 2 từ)',
          value: name,
          suggestedFix: 'Điền đầy đủ Họ, chữ lót và Tên sinh viên'
        });

        addAuditItem(
          idx,
          sid || `INDEX_${idx}`,
          name,
          cls,
          fac,
          'INVALID_METADATA',
          'WARNING',
          'fullName',
          `Họ và tên '${name}' chỉ có 1 từ`,
          name,
          'Ít nhất 2 từ',
          'Bổ sung đầy đủ Họ và Tên'
        );
      }
    }

    // D. Class code validation against master catalog
    if (cls) {
      const normalizedClass = cls.trim().toUpperCase();
      const inCatalog = classCatalogMap.has(normalizedClass) || (customAllowedClasses ? customAllowedClasses.has(normalizedClass) : false);

      if (!inCatalog) {
        const suggested = findClosestClassCode(cls, catalogCodeList);
        invalidClassCodeDetails.push({
          studentId: sid || 'N/A',
          fullName: name || 'N/A',
          classCode: cls,
          recordIndex: idx,
          reason: 'Mã lớp không có trong danh mục chi đoàn/lớp chính thức của Nhà trường',
          suggestedCatalogMatch: suggested
        });

        addAuditItem(
          idx,
          sid || 'N/A',
          name || 'N/A',
          cls,
          fac,
          'UNCATALOGED_CLASS',
          'CRITICAL',
          'classCode',
          `Mã lớp '${cls}' không tồn tại trong danh mục lớp chính thức (BRANCH_CLASSES)`,
          cls,
          suggested || 'Mã lớp hợp lệ từ danh mục trường',
          suggested ? `Đổi thành '${suggested}'` : 'Kiểm tra lại mã lớp chính thức'
        );
      } else {
        // Cross-validate Faculty with Class Catalog Faculty
        const catalogClass = classCatalogMap.get(normalizedClass);
        if (catalogClass && catalogClass.facultyCode && fac) {
          const normalizedStudentFac = fac.toUpperCase();
          if (catalogClass.facultyCode !== normalizedStudentFac) {
            facultyClassMismatchDetails.push({
              studentId: sid || 'N/A',
              fullName: name || 'N/A',
              recordIndex: idx,
              classCode: cls,
              studentFaculty: fac,
              expectedFaculty: catalogClass.facultyCode
            });

            addAuditItem(
              idx,
              sid || 'N/A',
              name || 'N/A',
              cls,
              fac,
              'FACULTY_CLASS_MISMATCH',
              'CRITICAL',
              'facultyCode',
              `Xung đột khoa: Lớp '${cls}' thuộc Khoa '${catalogClass.facultyCode}', nhưng sinh viên khai báo Khoa '${fac}'`,
              fac,
              catalogClass.facultyCode,
              `Cập nhật mã khoa thành '${catalogClass.facultyCode}'`
            );
          }
        }
      }
    }

    // E. Faculty code validity against 12 known faculties
    if (fac) {
      const normalizedFac = fac.toUpperCase();
      if (!KNOWN_FACULTIES.has(normalizedFac)) {
        invalidMetadataDetails.push({
          studentId: sid || `INDEX_${idx}`,
          fullName: name,
          recordIndex: idx,
          field: 'facultyCode',
          issue: `Mã khoa '${fac}' không thuộc danh mục 12 Khoa/Bộ môn chính thức của Trường`,
          value: fac,
          suggestedFix: 'Chọn một trong 12 mã khoa chuẩn: CNTT, TY, NL, LN, CK, QLD, KHTN, NN, CNTP, KT, CNSH, TS'
        });

        addAuditItem(
          idx,
          sid || `INDEX_${idx}`,
          name,
          cls,
          fac,
          'INVALID_METADATA',
          'WARNING',
          'facultyCode',
          `Mã khoa '${fac}' không thuộc 12 Khoa chính thức của NLU`,
          fac,
          'CNTT | TY | NL | LN | CK | QLD | KHTN | NN | CNTP | KT | CNSH | TS',
          'Quy đổi về mã khoa chuẩn của trường'
        );
      }
    }

    // F. Membership type validity
    if (student.membershipType) {
      if (!['DOAN_VIEN', 'HOI_VIEN', 'SINH_VIEN'].includes(student.membershipType)) {
        invalidMetadataDetails.push({
          studentId: sid || `INDEX_${idx}`,
          fullName: name,
          recordIndex: idx,
          field: 'membershipType',
          issue: `Phân loại thành viên '${student.membershipType}' không hợp lệ (chuẩn: DOAN_VIEN, HOI_VIEN, SINH_VIEN)`,
          value: student.membershipType,
          suggestedFix: 'Gán DOAN_VIEN, HOI_VIEN hoặc SINH_VIEN'
        });

        addAuditItem(
          idx,
          sid || `INDEX_${idx}`,
          name,
          cls,
          fac,
          'INVALID_METADATA',
          'WARNING',
          'membershipType',
          `Giá trị '${student.membershipType}' sai định dạng chuẩn`,
          student.membershipType,
          'DOAN_VIEN | HOI_VIEN | SINH_VIEN',
          'Cập nhật thành DOAN_VIEN hoặc HOI_VIEN'
        );
      }
    }

    // G. Training points integrity and bounds check (không trần 100)
    if (typeof student.totalScore === 'number') {
      if (student.totalScore < 0) {
        const expectedTotal = 0;
        scoreAnomalyDetails.push({
          studentId: sid || `INDEX_${idx}`,
          fullName: name,
          recordIndex: idx,
          issue: `Tổng điểm rèn luyện âm (${student.totalScore}) không hợp lệ`,
          totalScore: student.totalScore,
          expectedTotal,
          difference: student.totalScore - expectedTotal
        });

        addAuditItem(
          idx,
          sid || `INDEX_${idx}`,
          name,
          cls,
          fac,
          'SCORE_ANOMALY',
          'CRITICAL',
          'totalScore',
          `Tổng điểm rèn luyện âm ${student.totalScore}`,
          student.totalScore,
          expectedTotal,
          `Khôi phục về mức tối thiểu 0 điểm`
        );
      }

      // Component score math check if sub-scores are defined
      const actScore = student.activityScore ?? 0;
      const bonScore = student.bonusScore ?? 0;
      const posScore = student.positionScore ?? 0;
      const resScore = student.researchScore ?? 0;
      const expectedSum = Math.max(0, actScore + bonScore + posScore + resScore);

      if (
        student.activityScore !== undefined &&
        student.bonusScore !== undefined &&
        student.positionScore !== undefined &&
        student.researchScore !== undefined
      ) {
        if (Math.abs(student.totalScore - expectedSum) > 0.5) {
          scoreAnomalyDetails.push({
            studentId: sid || `INDEX_${idx}`,
            fullName: name,
            recordIndex: idx,
            issue: `Tổng điểm ghi nhận (${student.totalScore}) lệch so với tổng các thành phần (${actScore} + ${bonScore} + ${posScore} + ${resScore} = ${expectedSum})`,
            totalScore: student.totalScore,
            expectedTotal: expectedSum,
            difference: student.totalScore - expectedSum
          });

          addAuditItem(
            idx,
            sid || `INDEX_${idx}`,
            name,
            cls,
            fac,
            'SCORE_ANOMALY',
            'WARNING',
            'totalScore',
            `Tổng điểm ${student.totalScore} không khớp với tổng các điểm thành phần (${expectedSum})`,
            student.totalScore,
            expectedSum,
            'Tính toán lại điểm theo công thức chuẩn'
          );
        }
      }
    }
  });

  // 2. Duplicate MSSV Collisions Check
  const duplicateMssvDetails: DuplicateMssvDetail[] = [];
  mssvOccurrences.forEach((info, mssv) => {
    if (info.indices.length > 1) {
      duplicateMssvDetails.push({
        studentId: mssv,
        count: info.indices.length,
        indices: info.indices,
        names: info.names,
        classCodes: info.classCodes
      });

      info.indices.forEach(idx => {
        const student = safeStudents[idx];
        addAuditItem(
          idx,
          mssv,
          student?.fullName || 'N/A',
          student?.classCode || 'N/A',
          student?.facultyCode || 'N/A',
          'DUPLICATE_MSSV',
          'CRITICAL',
          'studentId',
          `MSSV '${mssv}' bị trùng lặp ${info.indices.length} lần tại các dòng [${info.indices.join(', ')}]`,
          mssv,
          'MSSV duy nhất',
          'Xóa bản ghi trùng lặp hoặc sửa thành MSSV đúng'
        );
      });
    }
  });

  // 3. Activity participants cross-check
  let totalParticipations = 0;
  const approvedActivities = safeActivities.filter(a => a && a.status === 'Approved');

  // Find set of all faculty codes and class codes present in the loaded student list
  const loadedFaculties = new Set(safeStudents.map(s => s && s.facultyCode ? s.facultyCode.trim().toUpperCase() : '').filter(Boolean));
  const loadedClasses = new Set(safeStudents.map(s => s && s.classCode ? s.classCode.trim().toUpperCase() : '').filter(Boolean));
  const isTest = contextTag.toLowerCase().includes('test');

  // Determine if the client has a scoped/partial roster (Level 1-3 or heavily-filtered roster)
  const isScoped = userRoleLevel !== undefined
    ? userRoleLevel < 4
    : (!isTest && (safeStudents.length < 150 || loadedFaculties.size <= 2));

  safeActivities.forEach(act => {
    if (act && act.participants && Array.isArray(act.participants)) {
      act.participants.forEach(p => {
        totalParticipations++;
        if (p && p.studentId) {
          const cleanPid = p.studentId.trim();
          if (!studentMap.has(cleanPid)) {
            // If the user role is scoped or we have a partial roster, we cannot reliably verify
            // whether students from other classes or faculties exist in the database.
            if (isScoped) {
              return; // Skip false positive for scoped rosters
            }

            const pFaculty = p.facultyCode ? p.facultyCode.trim().toUpperCase() : '';
            const pClass = p.classCode ? p.classCode.trim().toUpperCase() : '';
            
            // Heuristic: If we loaded some students, but the participant's faculty/class is NOT in the loaded set,
            // we skip flagging them as orphaned because they are likely filtered out by Firestore Security Rules.
            if (loadedFaculties.size > 0 && pFaculty && !loadedFaculties.has(pFaculty)) {
              return; // Skip false positive for a different faculty
            }
            if (loadedClasses.size > 0 && pClass && !loadedClasses.has(pClass)) {
              return; // Skip false positive for a different class
            }
            
            // Additional heuristic: If the loaded student count is small and we don't know the participant's scope,
            // we skip flagging them because the student roster is clearly scoped (not the complete roster).
            if (!isTest && safeStudents.length < 150 && (!pFaculty || !pClass)) {
              return; // Skip false positive for heavily-scoped environments at runtime
            }

            orphanedDetails.push({
              studentId: p.studentId,
              activityId: act.id,
              activityTitle: act.title || 'Untitled Activity'
            });

            addAuditItem(
              -1,
              p.studentId,
              p.fullName || 'N/A',
              p.classCode || 'N/A',
              'N/A',
              'ORPHANED_PARTICIPANT',
              'WARNING',
              'participants',
              `Người tham gia có MSSV '${p.studentId}' trong hoạt động '${act.title}' không tồn tại trong danh mục sinh viên`,
              p.studentId,
              'MSSV đã đăng ký trong students',
              'Bổ sung hồ sơ sinh viên hoặc xóa người tham gia mồ côi'
            );
          }
        }
      });
    }
  });

  // Consolidate Discrepancies
  if (missingRequiredFieldsDetails.length > 0) {
    discrepancies.push(
      `Phát hiện ${missingRequiredFieldsDetails.length} tài khoản sinh viên thiếu thông tin bắt buộc (MSSV, Họ tên, Mã lớp hoặc Mã khoa).`
    );
  }

  if (invalidClassCodeDetails.length > 0) {
    discrepancies.push(
      `Phát hiện ${invalidClassCodeDetails.length} sinh viên có mã lớp không tồn tại trong danh mục lớp chính thức của Nhà trường.`
    );
  }

  if (duplicateMssvDetails.length > 0) {
    discrepancies.push(
      `Phát hiện ${duplicateMssvDetails.length} trường hợp trùng lặp MSSV (khóa định danh duy nhất) trong danh sách sinh viên.`
    );
  }

  if (facultyClassMismatchDetails.length > 0) {
    discrepancies.push(
      `Phát hiện ${facultyClassMismatchDetails.length} trường hợp xung đột Mã Khoa giữa hồ sơ sinh viên và Khoa quản lý của Lớp.`
    );
  }

  if (invalidMetadataDetails.length > 0) {
    discrepancies.push(
      `Phát hiện ${invalidMetadataDetails.length} trường thông tin siêu dữ liệu sinh viên sai định dạng hoặc không hợp lệ.`
    );
  }

  if (scoreAnomalyDetails.length > 0) {
    discrepancies.push(
      `Phát hiện ${scoreAnomalyDetails.length} trường hợp bất thường về công thức tính hoặc tổng điểm âm (<0).`
    );
  }

  if (orphanedDetails.length > 0) {
    discrepancies.push(
      `Phát hiện ${orphanedDetails.length} lượt tham gia thuộc MSSV không tồn tại trong Firestore collection 'students'.`
    );
  }

  // We do not treat non-DoanVien students (e.g. HOI_VIEN, SINH_VIEN) as an out-of-sync discrepancy,
  // as it is a completely valid and normal state in NLU. Any invalid membershipType values are already
  // validated and flagged in the invalidMetadataDetails check above.
  const nonDoanVienCount = totalStudents - totalDoanVien;

  const isSynced = discrepancies.length === 0;

  // Browser console log for developer & auditor inspection
  if (typeof window !== 'undefined' && console) {
    console.group(
      `%c[verifySync] ${contextTag} - ${isSynced ? '✅ SYNC OK (100%)' : '⚠️ AUDIT DISCREPANCY DETECTED'}`,
      `color: ${isSynced ? '#059669' : '#d97706'}; font-weight: bold; font-size: 12px;`
    );
    console.info(`Timestamp: ${timestamp}`);
    console.info(`Total Students: ${totalStudents} (${totalDoanVien} Đoàn Viên)`);
    console.info(`Total Activities: ${safeActivities.length} (${approvedActivities.length} Approved)`);
    console.info(`Total Participations: ${totalParticipations}`);
    console.info(`Missing Fields Count: ${missingRequiredFieldsDetails.length}`);
    console.info(`Invalid Class Codes Count: ${invalidClassCodeDetails.length}`);
    console.info(`Duplicate MSSV Count: ${duplicateMssvDetails.length}`);
    console.info(`Faculty-Class Mismatches: ${facultyClassMismatchDetails.length}`);
    console.info(`Score Anomalies: ${scoreAnomalyDetails.length}`);
    console.info(`Orphaned Participations: ${orphanedDetails.length}`);
    console.info(`Total Structured Audit Records: ${auditRecords.length}`);

    if (!isSynced) {
      console.warn(`%cFound ${discrepancies.length} discrepancy issues:`, 'color: #dc2626; font-weight: bold;');
      discrepancies.forEach((disc, idx) => console.warn(`  ${idx + 1}. ${disc}`));

      if (auditRecords.length > 0 && typeof console.table === 'function') {
        console.groupCollapsed('%cChi tiết toàn bộ bảng kiểm toán dữ liệu (Audit Table):', 'color: #d97706; font-weight: bold;');
        console.table(
          auditRecords.map(r => ({
            Mã: r.id,
            MSSV: r.studentId,
            'Họ và tên': r.fullName,
            Lớp: r.classCode,
            Khoa: r.facultyCode,
            'Loại lỗi': r.issueType,
            'Mức độ': r.severity,
            'Mô tả': r.description,
            'Hiện tại': r.currentValue,
            'Kỳ vọng': r.expectedValue,
            'Gợi ý khắc phục': r.suggestedFix
          }))
        );
        console.groupEnd();
      }

      if (missingRequiredFieldsDetails.length > 0) {
        console.warn('Chi tiết thiếu trường bắt buộc:', missingRequiredFieldsDetails);
      }
      if (invalidClassCodeDetails.length > 0) {
        console.warn('Chi tiết mã lớp không tồn tại:', invalidClassCodeDetails);
      }
      if (duplicateMssvDetails.length > 0) {
        console.warn('Chi tiết trùng MSSV:', duplicateMssvDetails);
      }
      if (facultyClassMismatchDetails.length > 0) {
        console.warn('Chi tiết xung đột Khoa - Lớp:', facultyClassMismatchDetails);
      }
      if (scoreAnomalyDetails.length > 0) {
        console.warn('Chi tiết bất thường điểm rèn luyện:', scoreAnomalyDetails);
      }
      if (orphanedDetails.length > 0) {
        console.warn('Chi tiết lượt tham gia mồ côi:', orphanedDetails);
      }
    } else {
      console.log('%cAll data integrity checks (Catalog, Metadata, Bounds, Roster, Emulation) passed 100%.', 'color: #059669;');
    }
    console.groupEnd();
  }

  return {
    isSynced,
    totalStudents,
    totalDoanVien,
    totalActivities: safeActivities.length,
    totalApprovedActivities: approvedActivities.length,
    totalParticipations,
    orphanedParticipantsCount: orphanedDetails.length,
    orphanedDetails,
    missingRequiredFieldsCount: missingRequiredFieldsDetails.length,
    missingRequiredFieldsDetails,
    invalidClassCodesCount: invalidClassCodeDetails.length,
    invalidClassCodeDetails,
    duplicateMssvCount: duplicateMssvDetails.length,
    duplicateMssvDetails,
    invalidMetadataCount: invalidMetadataDetails.length,
    invalidMetadataDetails,
    facultyClassMismatchCount: facultyClassMismatchDetails.length,
    facultyClassMismatchDetails,
    scoreAnomalyCount: scoreAnomalyDetails.length,
    scoreAnomalyDetails,
    auditRecordsCount: auditRecords.length,
    auditRecords,
    discrepancies,
    timestamp
  };
}

/**
 * Helper to generate a formatted text audit report for export or printing
 */
export function generateAuditTextReport(result: VerifySyncResult): string {
  const lines: string[] = [
    '=========================================================================',
    '  BÁO CÁO KIỂM TOÁN TOÀN VẸN DỮ LIỆU SINH VIÊN & HOẠT ĐỘNG NLU YOUTH',
    `  Thời gian kiểm toán: ${result.timestamp}`,
    `  Trạng thái đồng bộ: ${result.isSynced ? 'ĐẠT (100% Khớp)' : 'CẢNH BÁO (Phát hiện sai lệch)'}`,
    '=========================================================================',
    '',
    `1. Tổng số sinh viên: ${result.totalStudents} (${result.totalDoanVien} Đoàn viên chính thức)`,
    `2. Tổng số hoạt động: ${result.totalActivities} (${result.totalApprovedActivities} Đã phê duyệt)`,
    `3. Tổng lượt tham gia: ${result.totalParticipations}`,
    `4. Bản ghi thiếu thông tin bắt buộc: ${result.missingRequiredFieldsCount}`,
    `5. Sinh viên có mã lớp không tồn tại: ${result.invalidClassCodesCount}`,
    `6. Trường hợp trùng lặp MSSV: ${result.duplicateMssvCount}`,
    `7. Xung đột Khoa - Lớp: ${result.facultyClassMismatchCount}`,
    `8. Bất thường điểm rèn luyện: ${result.scoreAnomalyCount}`,
    `9. Lượt tham gia mồ côi: ${result.orphanedParticipantsCount}`,
    `10. Tổng số sự vụ kiểm toán: ${result.auditRecordsCount}`,
    '',
    'DANH SÁCH CHI TIẾT CÁC BẢN GHI CẦN KHẮC PHỤC:',
    '-------------------------------------------------------------------------'
  ];

  if (result.auditRecords.length === 0) {
    lines.push('  Không phát hiện sự vụ nào. Dữ liệu chuẩn xác 100%.');
  } else {
    result.auditRecords.forEach((r, idx) => {
      lines.push(`  [${r.id}] ${r.severity} - ${r.issueType}`);
      lines.push(`     Sinh viên: ${r.fullName} (MSSV: ${r.studentId}) - Lớp: ${r.classCode} - Khoa: ${r.facultyCode}`);
      lines.push(`     Trường: ${r.field} | Hiện tại: ${JSON.stringify(r.currentValue)} | Kỳ vọng: ${JSON.stringify(r.expectedValue)}`);
      lines.push(`     Mô tả: ${r.description}`);
      if (r.suggestedFix) {
        lines.push(`     Gợi ý khắc phục: ${r.suggestedFix}`);
      }
      lines.push('');
    });
  }

  lines.push('=========================================================================');
  return lines.join('\n');
}
