import {
  collection,
  getDocs,
  doc,
  writeBatch,
  query,
  where,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { firestoreRetryQueue } from './firestoreRetryQueue';
import { saveActivityLogToFirestore } from './firestoreService';
import { createDriveFile } from './driveService';

export interface ScanMetrics {
  totalDocsEstimate: number;
  duplicateStudentsCount: number;
  duplicateActivitiesCount: number;
  duplicateAttendanceCount: number;
  staleLogsCount: number;
  softDeletedCount: number;
  totalCleanupTargetCount: number;
  estimatedQuotaSavingKb: number;
  scannedAt: string;
  details: {
    duplicateStudentIds: string[];
    duplicateActivityIds: string[];
    duplicateAttendanceIds: string[];
    staleLogDocIds: string[];
    softDeletedDocIds: { collectionName: string; docId: string }[];
  };
}

export interface CleanupOptions {
  purgeDuplicateStudents?: boolean;
  purgeDuplicateActivities?: boolean;
  purgeDuplicateAttendance?: boolean;
  purgeStaleLogsDaysThreshold?: number; // e.g. 30 days
  purgeSoftDeleted?: boolean;
  clearCompletedRetryQueue?: boolean;
  archiveBeforePurging?: boolean;
  driveAccessToken?: string | null;
}

export interface CleanupResult {
  success: boolean;
  purgedCount: number;
  archivedFileName?: string;
  driveFileUrl?: string;
  message: string;
  purgedCategories: {
    duplicateStudents: number;
    duplicateActivities: number;
    duplicateAttendance: number;
    staleLogs: number;
    softDeletedDocs: number;
    retryQueueCleared: number;
  };
}

const COLLECTIONS = {
  STUDENTS: 'student_scores',
  ACTIVITIES: 'activities',
  CERTIFICATES: 'issuedCertificates',
  ACCOUNTS: 'systemAccounts',
  SYSTEM_LOGS: 'system_logs',
  SCORE_AUDIT_LOGS: 'score_audit_logs',
  STUDENT_AUDIT_LOGS: 'student_audit_logs',
  ATTENDANCE: 'attendance_records'
};

/**
  Scans Firestore collections to calculate metrics, duplicates, stale logs, and quota impact.
 */
export async function scanFirestoreQuotaMetrics(staleDaysThreshold: number = 30): Promise<ScanMetrics> {
  const details = {
    duplicateStudentIds: [] as string[],
    duplicateActivityIds: [] as string[],
    duplicateAttendanceIds: [] as string[],
    staleLogDocIds: [] as string[],
    softDeletedDocIds: [] as { collectionName: string; docId: string }[]
  };

  let totalDocsEstimate = 0;

  try {
    // 1. Scan Student Records for duplicates & soft-deleted
    const studentSnap = await getDocs(collection(db, COLLECTIONS.STUDENTS));
    totalDocsEstimate += studentSnap.size;
    const studentMap = new Map<string, { id: string; updatedAt: string; version: number }[]>();

    studentSnap.forEach(docSnap => {
      const data = docSnap.data();
      if (data.deleted || data.isDeleted) {
        details.softDeletedDocIds.push({ collectionName: COLLECTIONS.STUDENTS, docId: docSnap.id });
      }

      const key = String(data.studentId || docSnap.id).trim().toUpperCase();
      if (key) {
        if (!studentMap.has(key)) studentMap.set(key, []);
        studentMap.get(key)!.push({
          id: docSnap.id,
          updatedAt: data.updatedAt || '',
          version: Number(data.version || 0)
        });
      }
    });

    // Mark all but the latest version/updated student doc as duplicate
    studentMap.forEach(entries => {
      if (entries.length > 1) {
        entries.sort((a, b) => {
          if (a.version !== b.version) return b.version - a.version;
          return b.updatedAt.localeCompare(a.updatedAt);
        });
        // Keep index 0, mark remaining as duplicates
        for (let i = 1; i < entries.length; i++) {
          details.duplicateStudentIds.push(entries[i].id);
        }
      }
    });

    // 2. Scan Activity Submissions for duplicates & soft-deleted
    const activitySnap = await getDocs(collection(db, COLLECTIONS.ACTIVITIES));
    totalDocsEstimate += activitySnap.size;
    const activityMap = new Map<string, { id: string; updatedAt: string; version: number }[]>();

    activitySnap.forEach(docSnap => {
      const data = docSnap.data();
      if (data.deleted || data.isDeleted) {
        details.softDeletedDocIds.push({ collectionName: COLLECTIONS.ACTIVITIES, docId: docSnap.id });
      }

      const key = String(data.title || data.id || docSnap.id).trim().toLowerCase();
      if (key) {
        if (!activityMap.has(key)) activityMap.set(key, []);
        activityMap.get(key)!.push({
          id: docSnap.id,
          updatedAt: data.updatedAt || '',
          version: Number(data.version || 0)
        });
      }
    });

    activityMap.forEach(entries => {
      if (entries.length > 1) {
        entries.sort((a, b) => {
          if (a.version !== b.version) return b.version - a.version;
          return b.updatedAt.localeCompare(a.updatedAt);
        });
        for (let i = 1; i < entries.length; i++) {
          details.duplicateActivityIds.push(entries[i].id);
        }
      }
    });

    // 3. Scan Attendance Records for duplicates
    const attendanceSnap = await getDocs(collection(db, COLLECTIONS.ATTENDANCE));
    totalDocsEstimate += attendanceSnap.size;
    const attendanceMap = new Map<string, { id: string; createdAt: string }[]>();

    attendanceSnap.forEach(docSnap => {
      const data = docSnap.data();
      const key = `${data.studentId}_${data.activityId}`;
      if (data.studentId && data.activityId) {
        if (!attendanceMap.has(key)) attendanceMap.set(key, []);
        attendanceMap.get(key)!.push({
          id: docSnap.id,
          createdAt: data.createdAt || ''
        });
      }
    });

    attendanceMap.forEach(entries => {
      if (entries.length > 1) {
        entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        for (let i = 1; i < entries.length; i++) {
          details.duplicateAttendanceIds.push(entries[i].id);
        }
      }
    });

    // 4. Scan Stale Logs
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - staleDaysThreshold);
    const cutoffIso = cutoffDate.toISOString();

    const logCollections = [COLLECTIONS.SYSTEM_LOGS, COLLECTIONS.SCORE_AUDIT_LOGS, COLLECTIONS.STUDENT_AUDIT_LOGS];

    for (const colName of logCollections) {
      const snap = await getDocs(collection(db, colName));
      totalDocsEstimate += snap.size;
      snap.forEach(docSnap => {
        const data = docSnap.data();
        const ts = data.timestamp || data.createdAt || '';
        if (ts && ts < cutoffIso) {
          details.staleLogDocIds.push(`${colName}/${docSnap.id}`);
        }
      });
    }

    // 5. Scan soft-deleted certificates/accounts
    for (const colName of [COLLECTIONS.CERTIFICATES, COLLECTIONS.ACCOUNTS]) {
      const snap = await getDocs(collection(db, colName));
      totalDocsEstimate += snap.size;
      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.deleted || data.isDeleted) {
          details.softDeletedDocIds.push({ collectionName: colName, docId: docSnap.id });
        }
      });
    }
  } catch (err) {
    console.warn('[Firestore Cleanup Scan] Error scanning Firestore collections:', err);
  }

  const duplicateStudentsCount = details.duplicateStudentIds.length;
  const duplicateActivitiesCount = details.duplicateActivityIds.length;
  const duplicateAttendanceCount = details.duplicateAttendanceIds.length;
  const staleLogsCount = details.staleLogDocIds.length;
  const softDeletedCount = details.softDeletedDocIds.length;

  const totalCleanupTargetCount =
    duplicateStudentsCount + duplicateActivitiesCount + duplicateAttendanceCount + staleLogsCount + softDeletedCount;

  // Average doc size in Firestore ~1.2 KB
  const estimatedQuotaSavingKb = Math.round(totalCleanupTargetCount * 1.2);

  return {
    totalDocsEstimate,
    duplicateStudentsCount,
    duplicateActivitiesCount,
    duplicateAttendanceCount,
    staleLogsCount,
    softDeletedCount,
    totalCleanupTargetCount,
    estimatedQuotaSavingKb,
    scannedAt: new Date().toISOString(),
    details
  };
}

/**
 * Performs archiving and batch deletion of stale/duplicate Firestore documents.
 */
export async function executeFirestoreCleanupAndArchive(
  metrics: ScanMetrics,
  options: CleanupOptions = {}
): Promise<CleanupResult> {
  const {
    purgeDuplicateStudents = true,
    purgeDuplicateActivities = true,
    purgeDuplicateAttendance = true,
    purgeSoftDeleted = true,
    clearCompletedRetryQueue = true,
    archiveBeforePurging = true,
    driveAccessToken = null
  } = options;

  const docsToDelete: { collectionName: string; docId: string }[] = [];
  const archiveDataPayload: any[] = [];

  const purgedCategories = {
    duplicateStudents: 0,
    duplicateActivities: 0,
    duplicateAttendance: 0,
    staleLogs: 0,
    softDeletedDocs: 0,
    retryQueueCleared: 0
  };

  // Build target list
  if (purgeDuplicateStudents) {
    metrics.details.duplicateStudentIds.forEach(id => {
      docsToDelete.push({ collectionName: COLLECTIONS.STUDENTS, docId: id });
      purgedCategories.duplicateStudents++;
    });
  }

  if (purgeDuplicateActivities) {
    metrics.details.duplicateActivityIds.forEach(id => {
      docsToDelete.push({ collectionName: COLLECTIONS.ACTIVITIES, docId: id });
      purgedCategories.duplicateActivities++;
    });
  }

  if (purgeDuplicateAttendance) {
    metrics.details.duplicateAttendanceIds.forEach(id => {
      docsToDelete.push({ collectionName: COLLECTIONS.ATTENDANCE, docId: id });
      purgedCategories.duplicateAttendance++;
    });
  }

  metrics.details.staleLogDocIds.forEach(fullPath => {
    const parts = fullPath.split('/');
    if (parts.length === 2) {
      docsToDelete.push({ collectionName: parts[0], docId: parts[1] });
      purgedCategories.staleLogs++;
    }
  });

  if (purgeSoftDeleted) {
    metrics.details.softDeletedDocIds.forEach(item => {
      docsToDelete.push(item);
      purgedCategories.softDeletedDocs++;
    });
  }

  // 1. Archiving before deletion to preserve records
  let archivedFileName = '';
  let driveFileUrl = '';

  if (archiveBeforePurging && docsToDelete.length > 0) {
    const archiveObject = {
      archiveTimestamp: new Date().toISOString(),
      purgedCount: docsToDelete.length,
      purgedCategories,
      targetDocsList: docsToDelete
    };

    archiveDataPayload.push(archiveObject);
    archivedFileName = `Firestore_Archive_Quota_Cleanup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

    const blob = new Blob([JSON.stringify(archiveObject, null, 2)], { type: 'application/json' });

    // Download to browser
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = archivedFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Upload to Google Drive if token available
    if (driveAccessToken) {
      try {
        const driveRes = await createDriveFile(
          driveAccessToken,
          archivedFileName,
          JSON.stringify(archiveObject, null, 2),
          'application/json'
        );
        if (driveRes && driveRes.webViewLink) {
          driveFileUrl = driveRes.webViewLink;
        }
      } catch (err) {
        console.warn('[Firestore Archive Drive] Drive backup failed:', err);
      }
    }
  }

  // 2. Batch Purge from Firestore (In chunks of 400 to respect limit 500)
  let purgedCount = 0;
  const chunkSize = 400;

  for (let i = 0; i < docsToDelete.length; i += chunkSize) {
    const chunk = docsToDelete.slice(i, i + chunkSize);
    const batch = writeBatch(db);

    chunk.forEach(item => {
      const docRef = doc(db, item.collectionName, item.docId);
      batch.delete(docRef);
    });

    try {
      await batch.commit();
      purgedCount += chunk.length;
    } catch (err) {
      console.error(`[Firestore Batch Cleanup] Error committing batch ${i / chunkSize + 1}:`, err);
    }
  }

  // 3. Clear Retry Queue
  if (clearCompletedRetryQueue) {
    const statsBefore = firestoreRetryQueue.getStats();
    firestoreRetryQueue.clearCompleted();
    purgedCategories.retryQueueCleared = statsBefore.total - firestoreRetryQueue.getStats().total;
  }

  // 4. Log System Activity
  try {
    await saveActivityLogToFirestore({
      id: `log_cleanup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      category: 'SYSTEM_SECURITY',
      actionTitle: 'Tự động dọn dẹp & giải phóng Quota Firestore',
      actionDetail: `Đã dọn dẹp ${purgedCount} bản ghi trùng lặp/quá hạn từ Firestore. Tiết kiệm ~${Math.round(purgedCount * 1.2)} KB hạn mức DB.`,
      severity: 'success',
      performedBy: {
        userId: auth.currentUser?.uid || 'usr_system',
        userName: auth.currentUser?.displayName || 'Hệ Thống Dọn Dẹp Tự Động',
        userEmail: auth.currentUser?.email || 'admin@hcmuaf.edu.vn',
        roleName: 'Quản trị viên Cấp 4',
        roleLevel: 4
      },
      targetEntity: {
        type: 'BACKUP',
        id: 'firestore_quota',
        name: 'Firestore Quota Optimizer'
      }
    });
  } catch (err) {
    console.warn('[Firestore Cleanup Log] Could not save activity log:', err);
  }

  const msg = `Dọn dẹp thành công ${purgedCount} bản ghi trùng lặp và quá hạn trên Firestore! Hạn mức cơ sở dữ liệu đã được tối ưu hóa.`;

  return {
    success: true,
    purgedCount,
    archivedFileName,
    driveFileUrl,
    message: msg,
    purgedCategories
  };
}
