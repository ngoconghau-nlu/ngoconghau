import {
  collection,
  doc,
  getDoc,
  getDocs,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Unsubscribe,
  Query,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { firestoreRetryQueue } from './firestoreRetryQueue';
import {
  ActivitySubmission,
  StudentScoreRecord,
  SystemActivityLog,
  ScoreAuditLog,
  StudentAuditLog,
  IssuedCertificate,
  SystemUserAccount,
  AttendanceRecord,
  TargetItem,
  ParticipantRoleType,
  ActivityParticipantEntry
} from '../types';
import { calculateRankGrade, calculateGeneralRank, getPointsForRole } from '../data/mockData';
import { INITIAL_SYSTEM_ACCOUNTS, INITIAL_STUDENTS } from '../data/initialData';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  code: string;
  vietnameseMessage: string;
  operationType: OperationType;
  path: string | null;
}

export class FirestoreAppError extends Error {
  code: string;
  operationType: OperationType;
  path: string | null;
  vietnameseMessage: string;

  constructor(originalError: unknown, operationType: OperationType, path: string | null) {
    const rawMsg = originalError instanceof Error ? originalError.message : String(originalError);
    let code = 'unknown';

    if (typeof originalError === 'object' && originalError !== null && 'code' in originalError) {
      code = String((originalError as any).code);
    }
    if (rawMsg.includes('resource-exhausted') || rawMsg.includes('Quota limit exceeded') || rawMsg.includes('Quota exceeded') || rawMsg.includes('Free daily write units')) {
      code = 'resource-exhausted';
    } else if (rawMsg.includes('permission-denied') || rawMsg.includes('Missing or insufficient permissions')) {
      code = 'permission-denied';
    } else if (rawMsg.includes('unavailable') || rawMsg.includes('offline') || rawMsg.includes('Failed to get document')) {
      code = 'unavailable';
    } else if (rawMsg.includes('not-found')) {
      code = 'not-found';
    } else if (rawMsg.includes('already-exists')) {
      code = 'already-exists';
    } else if (rawMsg.includes('aborted') || rawMsg.includes('conflict')) {
      code = 'aborted';
    }

    let vietnameseMessage = 'Lỗi tương tác với cơ sở dữ liệu Firestore.';
    switch (code) {
      case 'permission-denied':
        vietnameseMessage = 'Từ chối truy cập: Tài khoản của bạn không có quyền thực hiện thao tác này.';
        break;
      case 'unavailable':
        vietnameseMessage = 'Dịch vụ Firestore tạm thời không khả dụng hoặc mất kết nối mạng. Dữ liệu sẽ tự động đồng bộ khi có mạng.';
        break;
      case 'not-found':
        vietnameseMessage = 'Không tìm thấy bản ghi dữ liệu yêu cầu trên hệ thống.';
        break;
      case 'already-exists':
        vietnameseMessage = 'Bản ghi dữ liệu đã tồn tại trong cơ sở dữ liệu.';
        break;
      case 'aborted':
        vietnameseMessage = 'Thao tác bị hủy do xung đột dữ liệu phiên làm việc đồng thời.';
        break;
      case 'resource-exhausted':
        vietnameseMessage = 'Hệ thống vượt quá hạn mức truy vấn cơ sở dữ liệu Cloud Firestore (Daily Quota Exceeded). Dữ liệu được bảo toàn an toàn trong bộ nhớ máy.';
        break;
      case 'unauthenticated':
        vietnameseMessage = 'Phiên làm việc hết hạn. Vui lòng đăng nhập lại tài khoản Google.';
        break;
      default:
        vietnameseMessage = rawMsg.length > 150 ? rawMsg.slice(0, 150) + '...' : rawMsg;
    }

    super(vietnameseMessage);
    this.name = 'FirestoreAppError';
    this.code = code;
    this.operationType = operationType;
    this.path = path;
    this.vietnameseMessage = vietnameseMessage;
  }
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  options?: { shouldThrow?: boolean }
): FirestoreAppError {
  const appError = new FirestoreAppError(error, operationType, path);
  // Log sanitized diagnostic info without sensitive user payload or token details
  console.warn(`[Firestore ${operationType.toUpperCase()}] ${path || 'general'}: ${appError.vietnameseMessage} (${appError.code})`);

  if (appError.code === 'resource-exhausted') {
    firestoreRetryQueue.setQuotaExceeded(true, appError.vietnameseMessage);
  }

  if (options?.shouldThrow !== false) {
    throw appError;
  }
  return appError;
}

/**
 * Executes a Firestore async operation with exponential backoff retries for transient network drops or long-polling timeouts.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  retries = 3,
  delayMs = 500
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await operation();
    } catch (err: any) {
      lastError = err;
      const rawMsg = err instanceof Error ? err.message : String(err);
      const code = (err && typeof err === 'object' && 'code' in err) ? String(err.code) : '';
      
      const isQuotaExceeded =
        code === 'resource-exhausted' ||
        rawMsg.includes('resource-exhausted') ||
        rawMsg.includes('Quota limit exceeded') ||
        rawMsg.includes('Quota exceeded') ||
        rawMsg.includes('Free daily write units');

      if (isQuotaExceeded) {
        // Do not retry quota exceeded errors immediately to prevent backoff spam
        throw err;
      }

      const isTransient =
        code === 'unavailable' ||
        code === 'deadline-exceeded' ||
        rawMsg.includes('unavailable') ||
        rawMsg.includes('offline') ||
        rawMsg.includes('timeout') ||
        rawMsg.includes('network') ||
        rawMsg.includes('Failed to fetch') ||
        rawMsg.includes('longPolling');

      if (isTransient && attempt < retries - 1) {
        console.info(`[Firestore Retry] Lần thử ${attempt + 1}/${retries} sau gián đoạn kết nối. Đang thử lại trong ${delayMs * Math.pow(2, attempt)}ms...`);
        await new Promise(res => setTimeout(res, delayMs * Math.pow(2, attempt)));
      } else {
        throw err;
      }
    }
  }
  throw lastError;
}

// Test connection to Firestore
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const testPromise = getDoc(doc(db, 'system_meta', 'connection_test'));
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('the client is offline or timeout')), 3500)
    );
    await Promise.race([testPromise, timeoutPromise]);
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('offline') || msg.includes('unavailable') || msg.includes('timeout') || msg.includes('Failed to get document')) {
      console.info('Firestore: Hệ thống đang sẵn sàng ở chế độ bộ nhớ ngoại tuyến (offline persistence).');
    } else {
      console.warn('Firestore connection check:', msg);
    }
    return false;
  }
}

// ----------------------------------------------------
// VALIDATION HELPERS BEFORE FIRESTORE WRITE
// ----------------------------------------------------

export interface FirestoreValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate Student record before committing to Firestore
 */
export function validateStudentBeforeFirestore(student: Partial<StudentScoreRecord>): FirestoreValidationResult {
  const errors: string[] = [];

  const cleanId = String(student.studentId || '').trim();
  if (!cleanId) {
    errors.push('MSSV không được để trống.');
  } else if (cleanId.length < 4 || cleanId.length > 25) {
    errors.push(`MSSV "${cleanId}" có độ dài không hợp lệ (yêu cầu 4-25 ký tự).`);
  }

  const cleanName = String(student.fullName || '').trim();
  if (!cleanName) {
    errors.push('Họ và tên sinh viên không được để trống.');
  } else if (cleanName.length < 2) {
    errors.push(`Họ và tên "${cleanName}" quá ngắn (tối thiểu 2 ký tự).`);
  }

  if (student.totalScore !== undefined) {
    const score = Number(student.totalScore);
    if (isNaN(score) || score < 0 || score > 100) {
      errors.push(`Tổng điểm rèn luyện (${student.totalScore}) phải nằm trong giới hạn [0, 100].`);
    }
  }

  if (student.activityScore !== undefined) {
    const actScore = Number(student.activityScore);
    if (isNaN(actScore) || actScore < 0 || actScore > 100) {
      errors.push(`Điểm hoạt động (${student.activityScore}) không hợp lệ.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate Activity record before committing to Firestore
 */
export function validateActivityBeforeFirestore(activity: Partial<ActivitySubmission>): FirestoreValidationResult {
  const errors: string[] = [];

  const cleanTitle = String(activity.title || '').trim();
  if (!cleanTitle) {
    errors.push('Tên hoạt động/chương trình không được để trống.');
  } else if (cleanTitle.length < 2) {
    errors.push(`Tên hoạt động "${cleanTitle}" quá ngắn (tối thiểu 2 ký tự).`);
  }

  // If orgCode is missing or empty, assign fallback rather than rejecting
  if (!activity.orgCode || !String(activity.orgCode).trim()) {
    activity.orgCode = 'VP_DOAN';
  }

  if (activity.programLevel !== undefined && activity.programLevel !== null) {
    const lvl = Number(activity.programLevel);
    if (isNaN(lvl) || lvl < 1 || lvl > 4) {
      activity.programLevel = 1;
    }
  }

  if (activity.totalLevelScore !== undefined && activity.totalLevelScore !== null) {
    const totalScore = Number(activity.totalLevelScore);
    if (isNaN(totalScore) || totalScore < 0) {
      activity.totalLevelScore = 3;
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ----------------------------------------------------
// ACTIVITIES (Firestore real-time & persistent CRUD)
// ----------------------------------------------------
const ACTIVITIES_COLLECTION = 'activities';

export function subscribeActivities(
  onData: (activities: ActivitySubmission[], metadata?: { fromCache: boolean; hasPendingWrites: boolean }) => void,
  onError?: (err: any) => void,
  options?: { includeDeleted?: boolean }
): Unsubscribe {
  const colRef = collection(db, ACTIVITIES_COLLECTION);
  return onSnapshot(
    colRef,
    { includeMetadataChanges: true },
    snapshot => {
      const items: ActivitySubmission[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as ActivitySubmission;
        items.push({
          ...data,
          id: docSnap.id || data.id
        });
      });
      const filtered = options?.includeDeleted === false ? items.filter(a => !a.deleted && !a.isDeleted) : items;
      onData(filtered, {
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites
      });
    },
    error => {
      const appErr = handleFirestoreError(error, OperationType.GET, ACTIVITIES_COLLECTION, { shouldThrow: false });
      if (onError) onError(appErr);
    }
  );
}

// Subscribes only to active (non-soft-deleted) activities
export function subscribeActiveActivities(
  onData: (activities: ActivitySubmission[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  return subscribeActivities(onData, onError, { includeDeleted: false });
}

export async function saveActivityToFirestore(
  activity: ActivitySubmission,
  options?: { expectedVersion?: number }
): Promise<void> {
  const validation = validateActivityBeforeFirestore(activity);
  if (!validation.isValid) {
    throw new Error(`Dữ liệu hoạt động không hợp lệ trước khi gửi lên Firestore: ${validation.errors.join('; ')}`);
  }

  const docRef = doc(db, ACTIVITIES_COLLECTION, activity.id);
  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      let currentVersion = 0;
      if (snap.exists()) {
        currentVersion = snap.data()?.version || 0;
        if (options?.expectedVersion !== undefined && currentVersion > options.expectedVersion) {
          throw new Error(`Xung đột phiên bản (Concurrency Conflict): Hoạt động "${activity.title}" đã được sửa trên máy chủ (v${currentVersion}).`);
        }
      }
      const nextVersion = Math.max(currentVersion, activity.version || 0) + 1;
      const sanitized: ActivitySubmission = {
        ...JSON.parse(JSON.stringify(activity)),
        version: nextVersion,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.email || activity.updatedBy || 'system'
      };
      transaction.set(docRef, sanitized, { merge: true });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${ACTIVITIES_COLLECTION}/${activity.id}`);
  }
}

// Soft-delete an activity with 'deleted' boolean flag and 'deletedAt' timestamp
export async function softDeleteActivityInFirestore(
  activityId: string,
  deletedBy?: string,
  reason?: string
): Promise<void> {
  const docRef = doc(db, ACTIVITIES_COLLECTION, activityId);
  const now = new Date().toISOString();
  const currentEmail = deletedBy || auth.currentUser?.email || 'system';
  try {
    await updateDoc(docRef, {
      deleted: true,
      isDeleted: true,
      deletedAt: now,
      deletedBy: currentEmail,
      deletedReason: reason || 'Soft deleted via admin interface',
      updatedAt: now
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ACTIVITIES_COLLECTION}/${activityId}`);
  }
}

// Convenient alias for soft deleting an activity
export async function softDeleteActivity(activityId: string, reason?: string): Promise<void> {
  return softDeleteActivityInFirestore(activityId, auth.currentUser?.email || 'system', reason);
}

// Default delete mechanism: performs soft delete instead of direct deletion
export async function deleteActivityFromFirestore(activityId: string, reason?: string): Promise<void> {
  return softDeleteActivityInFirestore(activityId, auth.currentUser?.email || 'system', reason);
}

// Restore a soft-deleted activity
export async function restoreActivityInFirestore(activityId: string): Promise<void> {
  const docRef = doc(db, ACTIVITIES_COLLECTION, activityId);
  try {
    await updateDoc(docRef, {
      deleted: false,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      deletedReason: null,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ACTIVITIES_COLLECTION}/${activityId}`);
  }
}

// Direct physical deletion from database (Level 4 Admin hard delete only)
export async function hardDeleteActivityFromFirestore(activityId: string): Promise<void> {
  const docRef = doc(db, ACTIVITIES_COLLECTION, activityId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${ACTIVITIES_COLLECTION}/${activityId}`);
  }
}

export async function batchSaveActivitiesToFirestore(activitiesList: ActivitySubmission[]): Promise<void> {
  if (!activitiesList.length) return;

  // Validate and sanitize activities
  const validActivities: ActivitySubmission[] = [];
  const rejectedActivities: { act: ActivitySubmission; errors: string[] }[] = [];

  activitiesList.forEach(act => {
    const val = validateActivityBeforeFirestore(act);
    if (val.isValid) {
      validActivities.push(act);
    } else {
      rejectedActivities.push({ act, errors: val.errors });
    }
  });

  if (rejectedActivities.length > 0) {
    console.warn(`[Firestore Activity Validation] Bỏ qua ${rejectedActivities.length} hoạt động không hợp lệ:`, rejectedActivities);
  }

  if (!validActivities.length) return;

  const chunkSize = 400;
  const now = new Date().toISOString();
  const currentEmail = auth.currentUser?.email || 'system';

  for (let i = 0; i < validActivities.length; i += chunkSize) {
    const chunk = validActivities.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach(act => {
      const docRef = doc(db, ACTIVITIES_COLLECTION, act.id);
      const sanitized: ActivitySubmission = {
        ...JSON.parse(JSON.stringify(act)),
        version: (act.version || 0) + 1,
        updatedAt: now,
        updatedBy: currentEmail
      };
      batch.set(docRef, sanitized, { merge: true });
    });
    try {
      await withRetry(() => batch.commit());
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, ACTIVITIES_COLLECTION);
    }
  }
}

// Batch soft-delete activities using deleted flag and deletedAt timestamp instead of direct deletion
export async function batchSoftDeleteActivitiesFromFirestore(activityIds: string[], reason?: string): Promise<void> {
  if (!activityIds.length) return;
  const chunkSize = 400;
  const now = new Date().toISOString();
  const currentEmail = auth.currentUser?.email || 'system';

  for (let i = 0; i < activityIds.length; i += chunkSize) {
    const chunk = activityIds.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach(id => {
      const docRef = doc(db, ACTIVITIES_COLLECTION, id);
      batch.update(docRef, {
        deleted: true,
        isDeleted: true,
        deletedAt: now,
        deletedBy: currentEmail,
        deletedReason: reason || 'Batch soft deleted',
        updatedAt: now
      });
    });
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, ACTIVITIES_COLLECTION);
    }
  }
}

// Default batch delete mechanism: performs soft delete instead of direct deletion
export async function batchDeleteActivitiesFromFirestore(activityIds: string[]): Promise<void> {
  return batchSoftDeleteActivitiesFromFirestore(activityIds);
}

// ----------------------------------------------------
// STUDENTS (Firestore real-time & persistent CRUD)
// ----------------------------------------------------
const STUDENTS_COLLECTION = 'students';

export function subscribeStudents(
  onData: (students: StudentScoreRecord[], metadata?: { fromCache: boolean; hasPendingWrites: boolean }) => void,
  onError?: (err: any) => void,
  options?: { 
    includeDeleted?: boolean;
    scope?: {
      roleLevel: number;
      orgCode?: string;
      classCode?: string;
      studentId?: string;
    }
  }
): Unsubscribe {
  const colRef = collection(db, STUDENTS_COLLECTION);
  let q: Query = colRef;

  if (options?.scope) {
    const { roleLevel, orgCode, classCode, studentId } = options.scope;
    if (roleLevel === 1 && studentId) {
      // L1: Can only view their own student record
      q = query(colRef, where('studentId', '==', studentId));
    } else if (roleLevel === 2) {
      // L2: Can only view students in their class or club
      if (classCode) {
        q = query(colRef, where('classCode', '==', classCode));
      } else if (orgCode) {
        q = query(colRef, where('facultyCode', '==', orgCode));
      }
    } else if (roleLevel === 3 && orgCode) {
      // L3: Can only view students in their faculty
      q = query(colRef, where('facultyCode', '==', orgCode));
    }
    // L4: No extra filter, receives full collection
  }

  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot: any) => {
      const items: StudentScoreRecord[] = [];
      snapshot.forEach((docSnap: any) => {
        const data = docSnap.data() as StudentScoreRecord;
        items.push({
          ...data,
          studentId: data.studentId || docSnap.id
        });
      });
      const filtered = options?.includeDeleted === false ? items.filter(s => !s.deleted && !s.isDeleted) : items;
      onData(filtered, {
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites
      });
    },
    (error: any) => {
      const appErr = handleFirestoreError(error, OperationType.GET, STUDENTS_COLLECTION, { shouldThrow: false });
      if (onError) onError(appErr);
    }
  );
}

// Subscribes only to active (non-soft-deleted) students
export function subscribeActiveStudents(
  onData: (students: StudentScoreRecord[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  return subscribeStudents(onData, onError, { includeDeleted: false });
}

export async function saveStudentToFirestore(
  student: StudentScoreRecord,
  options?: { expectedVersion?: number }
): Promise<void> {
  const cleanStudentId = String(student.studentId || '').trim();
  if (!cleanStudentId) return;
  const docRef = doc(db, STUDENTS_COLLECTION, cleanStudentId);
  try {
    await withRetry(() => runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      let currentVersion = 0;
      if (snap.exists()) {
        currentVersion = snap.data()?.version || 0;
        if (options?.expectedVersion !== undefined && currentVersion > options.expectedVersion) {
          throw new Error(`Xung đột phiên bản (Concurrency Conflict): Hồ sơ sinh viên "${student.fullName}" đã được cập nhật phiên bản mới hơn trên máy chủ (v${currentVersion}).`);
        }
      }
      const nextVersion = Math.max(currentVersion, student.version || 0) + 1;
      const cleanClassCode = String(student.classCode || (student as any).class || '').trim() || 'KHOA';
      const cleanFacultyCode = String(student.facultyCode || (student as any).faculty || '').trim() || 'KHOA';
      const cleanFullName = String(student.fullName || (student as any).studentName || 'Sinh viên').trim() || 'Sinh viên';

      const isDel = Boolean(student.deleted || student.isDeleted);
      const sanitized: StudentScoreRecord = {
        ...JSON.parse(JSON.stringify(student)),
        studentId: cleanStudentId,
        fullName: cleanFullName,
        classCode: cleanClassCode,
        facultyCode: cleanFacultyCode,
        deleted: isDel,
        isDeleted: isDel,
        version: nextVersion,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.email || student.updatedBy || 'system'
      };
      transaction.set(docRef, sanitized, { merge: true });
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${STUDENTS_COLLECTION}/${cleanStudentId}`);
  }
}

// Soft-delete a student with 'deleted' boolean flag and 'deletedAt' timestamp
export async function softDeleteStudentInFirestore(
  studentId: string,
  deletedBy?: string,
  reason?: string
): Promise<void> {
  const docRef = doc(db, STUDENTS_COLLECTION, studentId);
  const now = new Date().toISOString();
  const currentEmail = deletedBy || auth.currentUser?.email || 'system';
  try {
    await updateDoc(docRef, {
      deleted: true,
      isDeleted: true,
      deletedAt: now,
      deletedBy: currentEmail,
      deletedReason: reason || 'Soft deleted via admin interface',
      updatedAt: now
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${STUDENTS_COLLECTION}/${studentId}`);
  }
}

// Convenient alias for soft deleting a student
export async function softDeleteStudent(studentId: string, reason?: string): Promise<void> {
  return softDeleteStudentInFirestore(studentId, auth.currentUser?.email || 'system', reason);
}

// Default delete mechanism: performs soft delete instead of direct deletion
export async function deleteStudentFromFirestore(studentId: string, reason?: string): Promise<void> {
  return softDeleteStudentInFirestore(studentId, auth.currentUser?.email || 'system', reason);
}

// Restore a soft-deleted student
export async function restoreStudentInFirestore(studentId: string): Promise<void> {
  const docRef = doc(db, STUDENTS_COLLECTION, studentId);
  try {
    await updateDoc(docRef, {
      deleted: false,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      deletedReason: null,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${STUDENTS_COLLECTION}/${studentId}`);
  }
}

// Direct physical deletion from database (Level 4 Admin hard delete only)
export async function hardDeleteStudentFromFirestore(studentId: string): Promise<void> {
  const docRef = doc(db, STUDENTS_COLLECTION, studentId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${STUDENTS_COLLECTION}/${studentId}`);
  }
}

export async function batchSaveStudentsToFirestore(studentsList: StudentScoreRecord[]): Promise<void> {
  if (!studentsList.length) return;
  const chunkSize = 250;
  const now = new Date().toISOString();
  const currentEmail = auth.currentUser?.email || 'system';

  for (let i = 0; i < studentsList.length; i += chunkSize) {
    const chunk = studentsList.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach(s => {
      const cleanStudentId = String(s.studentId || '').trim();
      if (!cleanStudentId) return;
      const docRef = doc(db, STUDENTS_COLLECTION, cleanStudentId);
      const cleanClassCode = String(s.classCode || (s as any).class || '').trim() || 'KHOA';
      const cleanFacultyCode = String(s.facultyCode || (s as any).faculty || '').trim() || 'KHOA';
      const cleanFullName = String(s.fullName || (s as any).studentName || 'Sinh viên').trim() || 'Sinh viên';

      const isDel = Boolean(s.deleted || s.isDeleted);
      const sanitized: StudentScoreRecord = {
        ...JSON.parse(JSON.stringify(s)),
        studentId: cleanStudentId,
        fullName: cleanFullName,
        classCode: cleanClassCode,
        facultyCode: cleanFacultyCode,
        deleted: isDel,
        isDeleted: isDel,
        version: (s.version || 0) + 1,
        updatedAt: now,
        updatedBy: currentEmail
      };
      batch.set(docRef, sanitized, { merge: true });
    });
    try {
      await withRetry(() => batch.commit());
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, STUDENTS_COLLECTION);
    }
  }
}

// Batch soft-delete students using deleted flag and deletedAt timestamp instead of direct deletion
export async function batchSoftDeleteStudentsFromFirestore(studentIds: string[], reason?: string): Promise<void> {
  if (!studentIds.length) return;
  const chunkSize = 400;
  const now = new Date().toISOString();
  const currentEmail = auth.currentUser?.email || 'system';

  for (let i = 0; i < studentIds.length; i += chunkSize) {
    const chunk = studentIds.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach(id => {
      const docRef = doc(db, STUDENTS_COLLECTION, id);
      batch.update(docRef, {
        deleted: true,
        isDeleted: true,
        deletedAt: now,
        deletedBy: currentEmail,
        deletedReason: reason || 'Batch soft deleted',
        updatedAt: now
      });
    });
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, STUDENTS_COLLECTION);
    }
  }
}

// Default batch delete mechanism: performs soft delete instead of direct deletion
export async function batchDeleteStudentsFromFirestore(studentIds: string[]): Promise<void> {
  return batchSoftDeleteStudentsFromFirestore(studentIds);
}

// ----------------------------------------------------
// SYSTEM ACTIVITY LOGS (Firestore persistent audit - Append-Only)
// ----------------------------------------------------
const LOGS_COLLECTION = 'system_activity_logs';

export function subscribeActivityLogs(
  onData: (logs: SystemActivityLog[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, LOGS_COLLECTION);
  return onSnapshot(
    colRef,
    snapshot => {
      const items: SystemActivityLog[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as SystemActivityLog;
        items.push({
          ...data,
          id: docSnap.id || data.id
        });
      });
      // Sort newest first
      items.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      onData(items);
    },
    error => {
      const appErr = handleFirestoreError(error, OperationType.GET, LOGS_COLLECTION, { shouldThrow: false });
      if (onError) onError(appErr);
    }
  );
}

export async function saveActivityLogToFirestore(log: SystemActivityLog): Promise<void> {
  const docRef = doc(db, LOGS_COLLECTION, log.id);
  try {
    const sanitized = JSON.parse(JSON.stringify(log));
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${LOGS_COLLECTION}/${log.id}`);
  }
}

// ----------------------------------------------------
// SCORE AUDIT LOGS (Training Points Audit Trail - Append-Only)
// ----------------------------------------------------
const SCORE_AUDIT_LOGS_COLLECTION = 'score_audit_logs';

export function subscribeScoreAuditLogs(
  onData: (logs: ScoreAuditLog[]) => void,
  onError?: (err: any) => void,
  options?: {
    scope?: {
      roleLevel: number;
      orgCode?: string;
      classCode?: string;
      studentId?: string;
    }
  }
): Unsubscribe {
  const colRef = collection(db, SCORE_AUDIT_LOGS_COLLECTION);
  let q: Query = colRef;

  if (options?.scope) {
    const { roleLevel, orgCode, classCode, studentId } = options.scope;
    if (roleLevel === 1 && studentId) {
      q = query(colRef, where('studentId', '==', studentId));
    } else if (roleLevel === 2) {
      if (classCode) {
        q = query(colRef, where('classCode', '==', classCode));
      } else if (orgCode) {
        q = query(colRef, where('facultyCode', '==', orgCode));
      }
    } else if (roleLevel === 3 && orgCode) {
      q = query(colRef, where('facultyCode', '==', orgCode));
    }
  }

  return onSnapshot(
    q,
    (snapshot: any) => {
      const items: ScoreAuditLog[] = [];
      snapshot.forEach((docSnap: any) => {
        const data = docSnap.data() as ScoreAuditLog;
        items.push({
          ...data,
          id: docSnap.id || data.id
        });
      });
      items.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      onData(items);
    },
    (error: any) => {
      const appErr = handleFirestoreError(error, OperationType.GET, SCORE_AUDIT_LOGS_COLLECTION, { shouldThrow: false });
      if (onError) onError(appErr);
    }
  );
}

export async function saveScoreAuditLogToFirestore(log: ScoreAuditLog): Promise<void> {
  const docRef = doc(db, SCORE_AUDIT_LOGS_COLLECTION, log.id);
  try {
    const sanitized = JSON.parse(JSON.stringify(log));
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SCORE_AUDIT_LOGS_COLLECTION}/${log.id}`);
  }
}

export async function batchSaveScoreAuditLogsToFirestore(logs: ScoreAuditLog[]): Promise<void> {
  if (!logs.length) return;
  const chunkSize = 400;
  for (let i = 0; i < logs.length; i += chunkSize) {
    const chunk = logs.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach(l => {
      const docRef = doc(db, SCORE_AUDIT_LOGS_COLLECTION, l.id);
      batch.set(docRef, JSON.parse(JSON.stringify(l)), { merge: true });
    });
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, SCORE_AUDIT_LOGS_COLLECTION);
    }
  }
}

// ----------------------------------------------------
// STUDENT DATA AUDIT LOGS (Collection 'audit_logs' - Trạng thái Trước & Sau Cập Nhật)
// ----------------------------------------------------
const AUDIT_LOGS_COLLECTION = 'audit_logs';

export function computeStudentChangedFields(
  beforeState: Partial<StudentScoreRecord> | null,
  afterState: Partial<StudentScoreRecord> | null
): string[] {
  if (!beforeState || !afterState) return ['ALL_FIELDS'];
  const changed: string[] = [];
  const allKeys = Array.from(new Set([...Object.keys(beforeState), ...Object.keys(afterState)]));
  for (const key of allKeys) {
    if (['updatedAt', 'updatedBy', 'id'].includes(key)) continue;
    const v1 = JSON.stringify((beforeState as any)[key]);
    const v2 = JSON.stringify((afterState as any)[key]);
    if (v1 !== v2) {
      changed.push(key);
    }
  }
  return changed;
}

export function subscribeStudentAuditLogs(
  onData: (logs: StudentAuditLog[]) => void,
  onError?: (err: any) => void,
  options?: {
    scope?: {
      roleLevel: number;
      orgCode?: string;
      classCode?: string;
      studentId?: string;
    }
  }
): Unsubscribe {
  const colRef = collection(db, AUDIT_LOGS_COLLECTION);
  let q: Query = colRef;

  if (options?.scope) {
    const { roleLevel, orgCode, classCode, studentId } = options.scope;
    if (roleLevel === 1 && studentId) {
      q = query(colRef, where('studentId', '==', studentId));
    } else if (roleLevel === 2) {
      if (classCode) {
        q = query(colRef, where('classCode', '==', classCode));
      } else if (orgCode) {
        q = query(colRef, where('facultyCode', '==', orgCode));
      }
    } else if (roleLevel === 3 && orgCode) {
      q = query(colRef, where('facultyCode', '==', orgCode));
    }
  }

  return onSnapshot(
    q,
    (snapshot: any) => {
      const items: StudentAuditLog[] = [];
      snapshot.forEach((docSnap: any) => {
        const data = docSnap.data() as StudentAuditLog;
        items.push({
          ...data,
          id: docSnap.id || data.id
        });
      });
      items.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      onData(items);
    },
    (error: any) => {
      const appErr = handleFirestoreError(error, OperationType.GET, AUDIT_LOGS_COLLECTION, { shouldThrow: false });
      if (onError) onError(appErr);
    }
  );
}

export async function saveStudentAuditLogToFirestore(log: StudentAuditLog): Promise<void> {
  const docRef = doc(db, AUDIT_LOGS_COLLECTION, log.id);
  try {
    const beforeState = log.beforeState || log.previousData || null;
    const afterState = log.afterState || log.newData || null;
    const sanitizedLog: StudentAuditLog = {
      ...log,
      beforeState,
      afterState,
      previousData: beforeState,
      newData: afterState,
      changedFields: log.changedFields || computeStudentChangedFields(beforeState, afterState)
    };
    const sanitized = JSON.parse(JSON.stringify(sanitizedLog));
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${AUDIT_LOGS_COLLECTION}/${log.id}`);
  }
}

export async function batchSaveStudentAuditLogsToFirestore(logs: StudentAuditLog[]): Promise<void> {
  if (!logs.length) return;
  const chunkSize = 400;
  for (let i = 0; i < logs.length; i += chunkSize) {
    const chunk = logs.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach(l => {
      const docRef = doc(db, AUDIT_LOGS_COLLECTION, l.id);
      const beforeState = l.beforeState || l.previousData || null;
      const afterState = l.afterState || l.newData || null;
      const sanitizedLog: StudentAuditLog = {
        ...l,
        beforeState,
        afterState,
        previousData: beforeState,
        newData: afterState,
        changedFields: l.changedFields || computeStudentChangedFields(beforeState, afterState)
      };
      batch.set(docRef, JSON.parse(JSON.stringify(sanitizedLog)), { merge: true });
    });
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, AUDIT_LOGS_COLLECTION);
    }
  }
}



// ----------------------------------------------------
// ISSUED CERTIFICATES (Firestore persistent CRUD)
// ----------------------------------------------------
const CERTIFICATES_COLLECTION = 'issued_certificates';

export function subscribeIssuedCertificates(
  onData: (certs: IssuedCertificate[]) => void,
  onError?: (err: any) => void,
  options?: {
    scope?: {
      roleLevel: number;
      orgCode?: string;
      classCode?: string;
      studentId?: string;
    }
  }
): Unsubscribe {
  const colRef = collection(db, CERTIFICATES_COLLECTION);
  let q: Query = colRef;

  if (options?.scope) {
    const { roleLevel, orgCode, classCode, studentId } = options.scope;
    if (roleLevel === 1 && studentId) {
      q = query(colRef, where('studentId', '==', studentId));
    } else if (roleLevel === 2) {
      if (classCode) {
        q = query(colRef, where('classCode', '==', classCode));
      } else if (orgCode) {
        q = query(colRef, where('facultyCode', '==', orgCode));
      }
    } else if (roleLevel === 3 && orgCode) {
      q = query(colRef, where('facultyCode', '==', orgCode));
    }
  }

  return onSnapshot(
    q,
    (snapshot: any) => {
      const items: IssuedCertificate[] = [];
      snapshot.forEach((docSnap: any) => {
        const data = docSnap.data() as IssuedCertificate;
        items.push({
          ...data,
          id: docSnap.id || data.id
        });
      });
      onData(items);
    },
    (error: any) => {
      const appErr = handleFirestoreError(error, OperationType.GET, CERTIFICATES_COLLECTION, { shouldThrow: false });
      if (onError) onError(appErr);
    }
  );
}

export async function saveIssuedCertificateToFirestore(cert: IssuedCertificate): Promise<void> {
  const docRef = doc(db, CERTIFICATES_COLLECTION, cert.id);
  try {
    const sanitized = JSON.parse(JSON.stringify(cert));
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${CERTIFICATES_COLLECTION}/${cert.id}`);
  }
}

export async function deleteIssuedCertificateFromFirestore(certId: string): Promise<void> {
  const docRef = doc(db, CERTIFICATES_COLLECTION, certId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${CERTIFICATES_COLLECTION}/${certId}`);
  }
}

export async function batchSaveIssuedCertificatesToFirestore(certs: IssuedCertificate[]): Promise<void> {
  if (!certs.length) return;
  const chunkSize = 400;
  for (let i = 0; i < certs.length; i += chunkSize) {
    const chunk = certs.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach(c => {
      const docRef = doc(db, CERTIFICATES_COLLECTION, c.id);
      batch.set(docRef, JSON.parse(JSON.stringify(c)), { merge: true });
    });
    await batch.commit();
  }
}

// ----------------------------------------------------
// ATTENDANCE RECORDS (Ghi nhận điểm danh hoạt động sinh viên qua mã QR & Firebase)
// ----------------------------------------------------
const ATTENDANCE_COLLECTION = 'attendance_records';

/**
 * Ghi nhận bản ghi điểm danh sinh viên vào Firestore với mốc thời gian (timestamp)
 * và mã phiên định danh duy nhất (session token).
 */
export async function captureAttendanceRecordInFirestore(
  record: AttendanceRecord
): Promise<AttendanceRecord> {
  const cleanId = record.id || `${record.activityId}_${record.studentId}`;
  const docRef = doc(db, ATTENDANCE_COLLECTION, cleanId);
  try {
    const finalResult = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(docRef);
      if (snap.exists()) {
        // Record already exists! Return it without making any changes
        return snap.data() as AttendanceRecord;
      }
      // Record does not exist, so create it safely
      const sanitized: AttendanceRecord = {
        ...JSON.parse(JSON.stringify(record)),
        id: cleanId,
        checkInTimestamp: record.checkInTimestamp || new Date().toISOString(),
        createdAt: record.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdAtServer: serverTimestamp()
      };
      transaction.set(docRef, sanitized);
      return sanitized;
    });
    return finalResult;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${ATTENDANCE_COLLECTION}/${cleanId}`);
    throw error;
  }
}

/**
 * Truy vấn danh sách điểm danh từ Firestore theo Hoạt động hoặc Sinh viên
 */
export async function getAttendanceRecordsFromFirestore(
  activityId?: string,
  studentId?: string
): Promise<AttendanceRecord[]> {
  try {
    const colRef = collection(db, ATTENDANCE_COLLECTION);
    let q = query(colRef);
    if (activityId && studentId) {
      q = query(colRef, where('activityId', '==', activityId), where('studentId', '==', studentId));
    } else if (activityId) {
      q = query(colRef, where('activityId', '==', activityId));
    } else if (studentId) {
      q = query(colRef, where('studentId', '==', studentId));
    }
    const snap = await getDocs(q);
    const records: AttendanceRecord[] = [];
    snap.forEach(docSnap => {
      const data = docSnap.data() as AttendanceRecord;
      records.push({
        ...data,
        id: docSnap.id || data.id
      });
    });
    return records;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ATTENDANCE_COLLECTION);
    return [];
  }
}

/**
 * Đăng ký lắng nghe thời gian thực bản ghi điểm danh sinh viên
 */
export function subscribeAttendanceRecords(
  options: {
    activityId?: string;
    studentId?: string;
    onData: (records: AttendanceRecord[]) => void;
    onError?: (err: any) => void;
  }
): Unsubscribe {
  const colRef = collection(db, ATTENDANCE_COLLECTION);
  let q = query(colRef);
  if (options.activityId && options.studentId) {
    q = query(colRef, where('activityId', '==', options.activityId), where('studentId', '==', options.studentId));
  } else if (options.activityId) {
    q = query(colRef, where('activityId', '==', options.activityId));
  } else if (options.studentId) {
    q = query(colRef, where('studentId', '==', options.studentId));
  }
  return onSnapshot(
    q,
    snapshot => {
      const items: AttendanceRecord[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as AttendanceRecord;
        items.push({
          ...data,
          id: docSnap.id || data.id
        });
      });
      options.onData(items);
    },
    error => {
      const appErr = handleFirestoreError(error, OperationType.GET, ATTENDANCE_COLLECTION, { shouldThrow: false });
      if (options.onError) options.onError(appErr);
    }
  );
}

/**
 * Xóa bản ghi điểm danh khỏi Firestore (dành cho cấp quản trị)
 */
export async function deleteAttendanceRecordFromFirestore(attendanceId: string): Promise<void> {
  const docRef = doc(db, ATTENDANCE_COLLECTION, attendanceId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${ATTENDANCE_COLLECTION}/${attendanceId}`);
  }
}

// ----------------------------------------------------
// TARGETS (Danh mục Chỉ tiêu Đoàn - Hội & Đánh giá AI)
// ----------------------------------------------------
const TARGETS_COLLECTION = 'targets';

export function subscribeTargets(
  onData: (targets: TargetItem[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, TARGETS_COLLECTION);
  return onSnapshot(
    colRef,
    snapshot => {
      const items: TargetItem[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as TargetItem;
        items.push({
          ...data,
          id: docSnap.id || data.id
        });
      });
      onData(items);
    },
    error => {
      const appErr = handleFirestoreError(error, OperationType.GET, TARGETS_COLLECTION, { shouldThrow: false });
      if (onError) onError(appErr);
    }
  );
}

export async function saveTargetToFirestore(target: TargetItem): Promise<void> {
  const docRef = doc(db, TARGETS_COLLECTION, target.id);
  try {
    const sanitized = JSON.parse(JSON.stringify(target));
    sanitized.updatedAt = new Date().toISOString();
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${TARGETS_COLLECTION}/${target.id}`);
  }
}

export async function deleteTargetFromFirestore(targetId: string): Promise<void> {
  const docRef = doc(db, TARGETS_COLLECTION, targetId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${TARGETS_COLLECTION}/${targetId}`);
  }
}

export async function batchSaveTargetsToFirestore(targetsList: TargetItem[]): Promise<void> {
  if (!targetsList.length) return;
  const chunkSize = 400;
  for (let i = 0; i < targetsList.length; i += chunkSize) {
    const chunk = targetsList.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach(t => {
      const docRef = doc(db, TARGETS_COLLECTION, t.id);
      batch.set(docRef, JSON.parse(JSON.stringify(t)), { merge: true });
    });
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, TARGETS_COLLECTION);
    }
  }
}

// ----------------------------------------------------
// SYSTEM ACCOUNTS (RBAC Cấp quyền cán bộ trên Firestore)
// ----------------------------------------------------
const ACCOUNTS_COLLECTION = 'system_accounts';

export function subscribeSystemAccounts(
  onData: (accounts: SystemUserAccount[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const colRef = collection(db, ACCOUNTS_COLLECTION);
  return onSnapshot(
    colRef,
    snapshot => {
      const items: SystemUserAccount[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as SystemUserAccount;
        items.push({
          ...data,
          id: data.id || docSnap.id,
          email: data.email || docSnap.id
        });
      });
      onData(items);
    },
    error => {
      console.warn('System accounts Firestore sync:', error);
      if (onError) onError(error);
    }
  );
}

export type AccountFetchResult =
  | { status: "found"; account: SystemUserAccount }
  | { status: "not_found"; account: null }
  | { status: "error"; account: null; message: string; error: any };

export async function fetchSystemAccountByEmail(email: string): Promise<AccountFetchResult> {
  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail) return { status: "not_found", account: null };

  try {
    const docRef = doc(db, ACCOUNTS_COLLECTION, cleanEmail);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as SystemUserAccount;
      return {
        status: "found",
        account: {
          ...data,
          id: data.id || snap.id,
          email: cleanEmail
        }
      };
    }
    return { status: "not_found", account: null };
  } catch (err: any) {
    const appErr = handleFirestoreError(err, OperationType.GET, `${ACCOUNTS_COLLECTION}/${email}`, { shouldThrow: false });

    // Fallback to local storage or initial accounts when Firestore is offline or quota exceeded
    try {
      const rawAccounts = localStorage.getItem('nlu_youth_accounts_v2026_lock');
      if (rawAccounts) {
        const parsed: SystemUserAccount[] = JSON.parse(rawAccounts);
        const match = parsed.find(a => a.email && a.email.toLowerCase().trim() === cleanEmail);
        if (match) {
          return {
            status: "found",
            account: { ...match, id: match.id || cleanEmail, email: cleanEmail }
          };
        }
      }

      const initMatch = INITIAL_SYSTEM_ACCOUNTS.find(a => a.email && a.email.toLowerCase().trim() === cleanEmail);
      if (initMatch) {
        return {
          status: "found",
          account: { ...initMatch, id: initMatch.id || cleanEmail, email: cleanEmail }
        };
      }
    } catch (e) {
      console.warn('Local accounts cache fallback error:', e);
    }

    return {
      status: "error",
      account: null,
      message: appErr.vietnameseMessage,
      error: appErr
    };
  }
}

export type StudentFetchResult =
  | { status: "found"; student: StudentScoreRecord }
  | { status: "not_found"; student: null }
  | { status: "ambiguous"; student: null; message: string }
  | { status: "error"; student: null; message: string; error: any };

export async function fetchStudentByEmail(email: string): Promise<StudentFetchResult> {
  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail) return { status: "not_found", student: null };

  try {
    const colRef = collection(db, STUDENTS_COLLECTION);
    const q = query(colRef, where('email', '==', cleanEmail));
    const snap = await getDocs(q);
    if (snap.empty) {
      return { status: "not_found", student: null };
    }
    if (snap.docs.length > 1) {
      return { status: "ambiguous", student: null, message: `Phát hiện nhiều hồ sơ (${snap.docs.length}) liên kết với email: ${cleanEmail}` };
    }
    const docSnap = snap.docs[0];
    const data = docSnap.data() as StudentScoreRecord;
    return {
      status: "found",
      student: {
        ...data,
        studentId: data.studentId || docSnap.id
      }
    };
  } catch (err: any) {
    const appErr = handleFirestoreError(err, OperationType.GET, `${STUDENTS_COLLECTION}/query_by_email`, { shouldThrow: false });

    // Fallback to local storage or initial students when Firestore is offline or quota exceeded
    try {
      const rawStudents = localStorage.getItem('nlu_youth_students_v2026_lock');
      if (rawStudents) {
        const parsed: StudentScoreRecord[] = JSON.parse(rawStudents);
        const match = parsed.find(s => s.email && s.email.toLowerCase().trim() === cleanEmail);
        if (match) {
          return {
            status: "found",
            student: { ...match, studentId: match.studentId }
          };
        }
      }

      const initMatch = INITIAL_STUDENTS.find(s => s.email && s.email.toLowerCase().trim() === cleanEmail);
      if (initMatch) {
        return {
          status: "found",
          student: { ...initMatch, studentId: initMatch.studentId }
        };
      }
    } catch (e) {
      console.warn('Local students cache fallback error:', e);
    }

    return {
      status: "error",
      student: null,
      message: appErr.vietnameseMessage,
      error: appErr
    };
  }
}

export async function fetchStudentByUid(uid: string): Promise<StudentFetchResult> {
  if (!uid) return { status: "not_found", student: null };

  try {
    const colRef = collection(db, STUDENTS_COLLECTION);
    
    // Check 'uid' field
    const q1 = query(colRef, where('uid', '==', uid));
    const snap1 = await getDocs(q1);
    
    // Check 'userId' field as fallback/legacy
    const q2 = query(colRef, where('userId', '==', uid));
    const snap2 = await getDocs(q2);
    
    // Combine unique document IDs
    const docMap = new Map<string, any>();
    snap1.docs.forEach(docSnap => docMap.set(docSnap.id, docSnap));
    snap2.docs.forEach(docSnap => docMap.set(docSnap.id, docSnap));
    
    if (docMap.size === 0) {
      return { status: "not_found", student: null };
    }
    if (docMap.size > 1) {
      return { status: "ambiguous", student: null, message: `Phát hiện nhiều hồ sơ (${docMap.size}) liên kết với UID: ${uid}` };
    }
    
    const docSnap = Array.from(docMap.values())[0];
    const data = docSnap.data() as StudentScoreRecord;
    return {
      status: "found",
      student: {
        ...data,
        studentId: data.studentId || docSnap.id
      }
    };
  } catch (err: any) {
    const appErr = handleFirestoreError(err, OperationType.GET, `${STUDENTS_COLLECTION}/query_by_uid`, { shouldThrow: false });

    try {
      const rawStudents = localStorage.getItem('nlu_youth_students_v2026_lock');
      if (rawStudents) {
        const parsed: StudentScoreRecord[] = JSON.parse(rawStudents);
        const match = parsed.find(s => s.uid === uid);
        if (match) {
          return {
            status: "found",
            student: { ...match, studentId: match.studentId }
          };
        }
      }

      const initMatch = INITIAL_STUDENTS.find(s => s.uid === uid);
      if (initMatch) {
        return {
          status: "found",
          student: { ...initMatch, studentId: initMatch.studentId }
        };
      }
    } catch (e) {
      console.warn('Local students cache fallback by UID error:', e);
    }

    return {
      status: "error",
      student: null,
      message: appErr.vietnameseMessage,
      error: appErr
    };
  }
}

export async function getSingleSystemAccountDoc(email: string): Promise<SystemUserAccount | null> {
  const res = await fetchSystemAccountByEmail(email);
  if (res.status === "error") {
    throw res.error;
  }
  return res.account;
}

export async function saveSystemAccountToFirestore(account: SystemUserAccount): Promise<void> {
  const cleanEmail = account.email.toLowerCase().trim();
  const docRef = doc(db, ACCOUNTS_COLLECTION, cleanEmail);
  try {
    const sanitized: SystemUserAccount = {
      ...JSON.parse(JSON.stringify(account)),
      id: account.id || `acc_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      email: cleanEmail,
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${ACCOUNTS_COLLECTION}/${cleanEmail}`);
  }
}

export async function deleteSystemAccountFromFirestore(email: string): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();
  const docRef = doc(db, ACCOUNTS_COLLECTION, cleanEmail);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${ACCOUNTS_COLLECTION}/${cleanEmail}`);
  }
}

export async function batchSaveSystemAccountsToFirestore(accountsList: SystemUserAccount[]): Promise<void> {
  if (!accountsList.length) return;
  const chunkSize = 400;
  for (let i = 0; i < accountsList.length; i += chunkSize) {
    const chunk = accountsList.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach(acc => {
      const cleanEmail = acc.email.toLowerCase().trim();
      const docRef = doc(db, ACCOUNTS_COLLECTION, cleanEmail);
      batch.set(docRef, {
        ...JSON.parse(JSON.stringify(acc)),
        id: acc.id || `acc_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email: cleanEmail,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    });
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, ACCOUNTS_COLLECTION);
    }
  }
}

export async function ensureAdminAccountExists(defaultAccounts: SystemUserAccount[]): Promise<void> {
  try {
    for (const acc of defaultAccounts) {
      const cleanEmail = acc.email.toLowerCase().trim();
      const docRef = doc(db, ACCOUNTS_COLLECTION, cleanEmail);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        await setDoc(docRef, {
          ...JSON.parse(JSON.stringify(acc)),
          id: acc.id || `acc_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
          email: cleanEmail,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    }
  } catch (err) {
    console.warn('ensureAdminAccountExists skipped or offline:', err);
  }
}

// ----------------------------------------------------
// NAVIGATION MENU PERSISTENCE (Custom menu Cấp 4)
// ----------------------------------------------------
export function subscribeNavigationMenu(
  onData: (menuItems: any[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const docRef = doc(db, 'system_meta', 'navigation_menu');
  return onSnapshot(
    docRef,
    docSnap => {
      if (docSnap.exists() && Array.isArray(docSnap.data()?.items)) {
        onData(docSnap.data().items);
      }
    },
    error => {
      const appErr = handleFirestoreError(error, OperationType.GET, 'system_meta/navigation_menu', { shouldThrow: false });
      if (onError) onError(appErr);
    }
  );
}

export async function saveNavigationMenuToFirestore(items: any[]): Promise<void> {
  const docRef = doc(db, 'system_meta', 'navigation_menu');
  try {
    const sanitized = JSON.parse(JSON.stringify(items));
    await setDoc(docRef, { items: sanitized, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'system_meta/navigation_menu');
  }
}

// ----------------------------------------------------
// FOOTER CONFIG PERSISTENCE (Custom footer Cấp 4)
// ----------------------------------------------------
export function subscribeFooterConfig(
  onData: (config: any) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const docRef = doc(db, 'system_meta', 'footer_config');
  return onSnapshot(
    docRef,
    docSnap => {
      if (docSnap.exists() && docSnap.data()) {
        onData(docSnap.data());
      }
    },
    error => {
      const appErr = handleFirestoreError(error, OperationType.GET, 'system_meta/footer_config', { shouldThrow: false });
      if (onError) onError(appErr);
    }
  );
}

export async function saveFooterConfigToFirestore(config: any): Promise<void> {
  const docRef = doc(db, 'system_meta', 'footer_config');
  try {
    const sanitized = JSON.parse(JSON.stringify(config));
    await setDoc(docRef, { ...sanitized, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'system_meta/footer_config');
  }
}

// ----------------------------------------------------
// HEADER BRANDING PERSISTENCE (Custom logo & title Cấp 4)
// ----------------------------------------------------
export function subscribeHeaderBranding(
  onData: (branding: any) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const docRef = doc(db, 'system_meta', 'header_branding');
  return onSnapshot(
    docRef,
    docSnap => {
      if (docSnap.exists() && docSnap.data()) {
        onData(docSnap.data());
      }
    },
    error => {
      const appErr = handleFirestoreError(error, OperationType.GET, 'system_meta/header_branding', { shouldThrow: false });
      if (onError) onError(appErr);
    }
  );
}

export async function saveHeaderBrandingToFirestore(branding: any): Promise<void> {
  const docRef = doc(db, 'system_meta', 'header_branding');
  try {
    const sanitized = JSON.parse(JSON.stringify(branding));
    await setDoc(docRef, { ...sanitized, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'system_meta/header_branding');
  }
}

// ----------------------------------------------------
// SYSTEM DICTIONARY PERSISTENCE (Danh mục từ & cụm từ Cấp 4)
// ----------------------------------------------------
export function subscribeSystemDictionary(
  onData: (data: { terms?: any[] }) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const docRef = doc(db, 'system_meta', 'dictionary');
  return onSnapshot(
    docRef,
    docSnap => {
      if (docSnap.exists() && docSnap.data()) {
        onData(docSnap.data() as { terms?: any[] });
      }
    },
    error => {
      const appErr = handleFirestoreError(error, OperationType.GET, 'system_meta/dictionary', { shouldThrow: false });
      if (onError) onError(appErr);
    }
  );
}

export async function saveSystemDictionaryToFirestore(terms: any[]): Promise<void> {
  const docRef = doc(db, 'system_meta', 'dictionary');
  try {
    const sanitized = JSON.parse(JSON.stringify(terms));
    await setDoc(docRef, { terms: sanitized, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'system_meta/dictionary');
  }
}

// ----------------------------------------------------
// INITIAL SEEDING HELPER (Only one-time bootstrap on completely fresh cloud DB)
// ----------------------------------------------------
export async function seedInitialFirestoreDataIfEmpty(
  initialActivities: ActivitySubmission[],
  initialStudents: StudentScoreRecord[],
  initialLogs: SystemActivityLog[]
): Promise<boolean> {
  try {
    const metaDocRef = doc(db, 'system_meta', 'initial_seed');
    const metaSnap = await getDoc(metaDocRef);
    if (metaSnap.exists() && metaSnap.data()?.seeded === true) {
      return false; // Already seeded before, never overwrite user changes or deletions
    }

    // Check if activities or students collection already has data
    const actsSnap = await getDocs(collection(db, ACTIVITIES_COLLECTION));
    const stdsSnap = await getDocs(collection(db, STUDENTS_COLLECTION));
    if (!actsSnap.empty || !stdsSnap.empty) {
      await setDoc(metaDocRef, { seeded: true, updatedAt: new Date().toISOString() });
      return false;
    }

    // Seed activities once
    const actBatch = writeBatch(db);
    initialActivities.forEach(act => {
      const docRef = doc(db, ACTIVITIES_COLLECTION, act.id);
      actBatch.set(docRef, JSON.parse(JSON.stringify(act)));
    });
    await actBatch.commit();

    // Seed students once
    await batchSaveStudentsToFirestore(initialStudents);

    // Seed initial activity logs once
    const logBatch = writeBatch(db);
    initialLogs.slice(0, 15).forEach(l => {
      const docRef = doc(db, LOGS_COLLECTION, l.id);
      logBatch.set(docRef, JSON.parse(JSON.stringify(l)));
    });
    await logBatch.commit();

    // Mark seeded permanently
    await setDoc(metaDocRef, { seeded: true, updatedAt: new Date().toISOString() });
    return true;
  } catch (error) {
    console.warn('Firestore initial seeding skipped or offline:', error);
    return false;
  }
}

/**
 * Thực hiện điểm danh nguyên tử (atomic QR check-in) sử dụng Firestore Transaction.
 * Đảm bảo tính nhất quán tuyệt đối giữa điểm danh, cập nhật hoạt động và điểm rèn luyện.
 * Chống điểm danh trùng lập và cộng điểm hai lần khi ghi nhận đồng thời.
 */
export async function performCheckInTransaction(params: {
  activityId: string;
  studentId: string;
  role: ParticipantRoleType;
  token?: string;
  sessionId?: string;
  recordedByEmail: string;
  calculatedScore: number;
  user: any;
}): Promise<{
  success: boolean;
  message: string;
  record?: AttendanceRecord;
  isDuplicate?: boolean;
  studentData?: StudentScoreRecord;
  activityData?: ActivitySubmission;
}> {
  const cleanId = `${params.activityId}_${params.studentId}`;
  const studentDocRef = doc(db, STUDENTS_COLLECTION, params.studentId);
  const activityDocRef = doc(db, ACTIVITIES_COLLECTION, params.activityId);
  const attendanceDocRef = doc(db, ATTENDANCE_COLLECTION, cleanId);

  try {
    const txResult = await runTransaction(db, async (transaction) => {
      const studentSnap = await transaction.get(studentDocRef);
      const activitySnap = await transaction.get(activityDocRef);
      const attendanceSnap = await transaction.get(attendanceDocRef);

      if (attendanceSnap.exists()) {
        return {
          success: true,
          message: `Sinh viên đã được điểm danh trước đó cho hoạt động này!`,
          record: attendanceSnap.data() as AttendanceRecord,
          isDuplicate: true
        };
      }

      if (!studentSnap.exists()) {
        throw new Error(`Sinh viên với MSSV [${params.studentId}] không tồn tại trong hệ thống.`);
      }
      if (!activitySnap.exists()) {
        throw new Error(`Hoạt động [${params.activityId}] không tồn tại.`);
      }

      const freshStudent = studentSnap.data() as StudentScoreRecord;
      const freshAct = activitySnap.data() as ActivitySubmission;

      if (freshStudent.deleted || freshStudent.isDeleted) {
        throw new Error(`Hồ sơ sinh viên đã bị xóa.`);
      }
      if (freshAct.deleted || freshAct.isDeleted) {
        throw new Error(`Hoạt động đã bị xóa khỏi hệ thống.`);
      }
      if (freshAct.status !== "Approved") {
        throw new Error(`Hoạt động chưa được phê duyệt chính thức.`);
      }
      if (freshAct.isLocked) {
        throw new Error(`Hoạt động đã khóa điểm danh.`);
      }

      const assignedRole = params.role || "Tham dự";
      const programLevel = freshAct.programLevel || 1;
      const authoritativeScore = getPointsForRole(assignedRole, programLevel);

      const newRecord: AttendanceRecord = {
        id: cleanId,
        activityId: params.activityId,
        activityTitle: freshAct.title,
        studentId: freshStudent.studentId,
        studentName: freshStudent.fullName,
        classCode: freshStudent.classCode || "",
        facultyCode: freshStudent.facultyCode || "",
        role: assignedRole,
        checkInTimestamp: new Date().toISOString(),
        sessionToken: params.token || params.sessionId || `SESSION_${Date.now()}`,
        status: "Confirmed",
        scoreAwarded: authoritativeScore,
        recordedBy: params.recordedByEmail || "officer_scan",
        createdAt: new Date().toISOString(),
        createdAtServer: serverTimestamp()
      };

      const existingPartIndex = freshAct.participants ? freshAct.participants.findIndex(p => p.studentId === freshStudent.studentId) : -1;
      const updatedEntry: ActivityParticipantEntry = {
        studentId: freshStudent.studentId,
        fullName: freshStudent.fullName,
        classCode: freshStudent.classCode,
        facultyCode: freshStudent.facultyCode,
        role: assignedRole,
        pointsAwarded: authoritativeScore,
        recordedAt: new Date().toISOString().split("T")[0],
        attendanceStatus: "Confirmed",
        isConfirmed: true
      };

      let nextParticipants = freshAct.participants ? [...freshAct.participants] : [];
      if (existingPartIndex >= 0) {
        nextParticipants[existingPartIndex] = updatedEntry;
      } else {
        nextParticipants.push(updatedEntry);
      }

      const updatedAct: ActivitySubmission = {
        ...freshAct,
        officialParticipantCount: nextParticipants.length,
        participants: nextParticipants,
        updatedAt: new Date().toISOString(),
        updatedBy: params.recordedByEmail
      };

      const previousAwardedPoints = existingPartIndex >= 0 ? (freshAct.participants[existingPartIndex].pointsAwarded || 0) : 0;
      const netPointsToAdd = authoritativeScore - previousAwardedPoints;

      const currentActScore = freshStudent.activityScore || 0;
      const updatedActScore = Math.max(0, currentActScore + netPointsToAdd);
      const updatedCount = (freshStudent.approvedActivitiesCount || 0) + (existingPartIndex >= 0 ? 0 : 1);
      const newTotalScore = Math.max(0, (freshStudent.bonusScore || 0) + (freshStudent.positionScore || 0) + (freshStudent.researchScore || 0) + updatedActScore);

      const updatedStudent: StudentScoreRecord = {
        ...freshStudent,
        activityScore: updatedActScore,
        approvedActivitiesCount: updatedCount,
        totalScore: newTotalScore,
        rankGrade: calculateRankGrade(newTotalScore, freshStudent.academicYearNumber),
        rankGeneral: calculateGeneralRank(newTotalScore),
        updatedAt: new Date().toISOString(),
        updatedBy: params.recordedByEmail
      };

      // Write atomically in transaction
      transaction.set(attendanceDocRef, newRecord);
      transaction.set(studentDocRef, updatedStudent);
      transaction.set(activityDocRef, updatedAct);

      // Log append-only audit trail
      const auditLogId = `log_checkin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const auditDocRef = doc(db, SCORE_AUDIT_LOGS_COLLECTION, auditLogId);
      const auditLog: ScoreAuditLog = {
        id: auditLogId,
        timestamp: new Date().toISOString(),
        studentId: freshStudent.studentId,
        studentName: freshStudent.fullName,
        classCode: freshStudent.classCode || "N/A",
        facultyCode: freshStudent.facultyCode || "N/A",
        actionType: 'QR_CHECKIN',
        actionTitle: `Điểm danh hoạt động: ${freshAct.title}`,
        performedBy: {
          userId: params.user.id || 'usr_current',
          userName: params.user.fullName || params.user.email,
          userEmail: params.user.email,
          roleName: params.user.currentRole.roleName,
          roleLevel: params.user.currentRole.roleLevel,
          orgCode: params.user.currentRole.orgCode
        },
        previousScores: {
          bonusScore: freshStudent.bonusScore || 0,
          positionScore: freshStudent.positionScore || 0,
          researchScore: freshStudent.researchScore || 0,
          activityScore: freshStudent.activityScore || 0,
          totalScore: freshStudent.totalScore || 0
        },
        newScores: {
          bonusScore: freshStudent.bonusScore || 0,
          positionScore: freshStudent.positionScore || 0,
          researchScore: freshStudent.researchScore || 0,
          activityScore: updatedActScore,
          totalScore: newTotalScore
        },
        scoreDifference: netPointsToAdd,
        reason: `Điểm danh quét mã QR thành công với vai trò [${assignedRole}] (+${authoritativeScore}đ)`,
        ipAddress: '14.161.45.102 (Cổng Điểm Danh NLU)'
      };
      transaction.set(auditDocRef, auditLog);

      return {
        success: true,
        message: `Xác thực & điểm danh thành công cho ${freshStudent.fullName} (+${authoritativeScore}đ)!`,
        record: newRecord,
        isDuplicate: false,
        studentData: updatedStudent,
        activityData: updatedAct
      };
    });

    return txResult;
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Lỗi hệ thống khi ghi nhận điểm danh giao dịch.'
    };
  }
}
