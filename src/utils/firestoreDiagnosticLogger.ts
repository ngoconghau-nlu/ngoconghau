/**
 * Firestore Write Operations Diagnostic Logger Utility
 * Captures full error stack traces, error codes, user contexts, and payload structures
 * whenever a Firestore write (create, update, delete, bulk import) fails.
 */

export interface DiagnosticLogRecord {
  id: string;
  timestamp: string;
  operation: string;
  errorCode: string;
  errorName: string;
  errorMessage: string;
  errorStack: string;
  userContext: {
    email?: string;
    userId?: string;
    roleLevel?: number;
    orgCode?: string;
    navigatorOnline: boolean;
  };
  payloadAnalysis: {
    isArray: boolean;
    itemCount: number;
    totalKeys: number;
    keysPresent: string[];
    missingRequiredFields: string[];
    structureMap: Record<string, string>;
    rawPayloadPreview: any;
  };
  fullReportJson: string;
}

const diagnosticLogHistory: DiagnosticLogRecord[] = [];
const MAX_LOG_HISTORY = 50;

/**
 * Main diagnostic function to capture full error stack and payload structure on Firestore write failure,
 * log it to console, store in history, and trigger Toast notification.
 */
export function logFirestoreWriteDiagnostic(
  operation: string,
  payload: any,
  error: unknown,
  showToastFn: (
    message: string,
    type: 'success' | 'info' | 'warning' | 'error',
    options?: {
      title?: string;
      category?: any;
      actionLabel?: string;
      onAction?: () => void;
      durationMs?: number;
    }
  ) => void,
  userContext?: { email?: string; id?: string; roleLevel?: number; orgCode?: string }
): DiagnosticLogRecord {
  const timestamp = new Date().toISOString();
  const logId = `diag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. Extract error details & stack trace
  let errorMessage = 'Ghi dữ liệu Firestore bị từ chối';
  let errorCode = 'WRITE_FAILED';
  let errorName = 'UnknownError';
  let errorStack = 'Không có stack trace';

  if (error instanceof Error) {
    errorMessage = error.message || errorMessage;
    errorName = error.name || 'Error';
    errorStack = error.stack || (new Error().stack || 'Stack trace không khả dụng');
    if ('code' in error && (error as any).code) {
      errorCode = String((error as any).code);
    } else if ('vietnameseMessage' in error) {
      errorCode = 'FIRESTORE_APP_ERROR';
    }
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object') {
    errorMessage = (error as any).message || JSON.stringify(error);
    errorCode = (error as any).code || errorCode;
    errorName = (error as any).name || errorName;
    errorStack = (error as any).stack || errorStack;
  }

  // Fallback synthetic stack trace if none existed
  if (errorStack === 'Không có stack trace' || errorStack === 'Stack trace không khả dụng') {
    const syntheticErr = new Error(`Synthetic Stack Trace for ${operation}`);
    if (syntheticErr.stack) {
      errorStack = syntheticErr.stack;
    }
  }

  // 2. Analyze Payload Structure
  let isArray = Array.isArray(payload);
  let itemCount = isArray ? payload.length : 1;
  let keysPresent: string[] = [];
  let missingRequiredFields: string[] = [];
  let structureMap: Record<string, string> = {};

  if (payload && typeof payload === 'object') {
    const sampleObj = isArray ? (payload[0] || {}) : payload;
    keysPresent = Object.keys(sampleObj);

    Object.entries(sampleObj).forEach(([k, v]) => {
      let typeLabel: string = typeof v;
      if (v === null) typeLabel = 'null';
      else if (Array.isArray(v)) typeLabel = `Array(${v.length})`;
      
      let valSnippet = String(v);
      if (typeof v === 'string' && v.length > 35) {
        valSnippet = v.slice(0, 32) + '...';
      }
      structureMap[k] = `${typeLabel} [${valSnippet}]`;
    });

    // Check mandatory fields for Activity operations
    if (!sampleObj.title || !String(sampleObj.title).trim()) {
      missingRequiredFields.push('title (Tên hoạt động)');
    }
    if (!sampleObj.id || !String(sampleObj.id).trim()) {
      missingRequiredFields.push('id (Mã hoạt động)');
    }
    if (!sampleObj.orgCode || !String(sampleObj.orgCode).trim()) {
      missingRequiredFields.push('orgCode (Mã đơn vị)');
    }
  }

  // 3. Build Record
  const logRecord: DiagnosticLogRecord = {
    id: logId,
    timestamp,
    operation,
    errorCode,
    errorName,
    errorMessage,
    errorStack,
    userContext: {
      email: userContext?.email || 'N/A',
      userId: userContext?.id || 'N/A',
      roleLevel: userContext?.roleLevel ?? -1,
      orgCode: userContext?.orgCode || 'N/A',
      navigatorOnline: typeof navigator !== 'undefined' ? navigator.onLine : true
    },
    payloadAnalysis: {
      isArray,
      itemCount,
      totalKeys: keysPresent.length,
      keysPresent,
      missingRequiredFields,
      structureMap,
      rawPayloadPreview: payload
    },
    fullReportJson: ''
  };

  logRecord.fullReportJson = JSON.stringify(logRecord, null, 2);

  // Store in in-memory history
  diagnosticLogHistory.unshift(logRecord);
  if (diagnosticLogHistory.length > MAX_LOG_HISTORY) {
    diagnosticLogHistory.pop();
  }

  // 4. Output rich Console Group
  console.group(`🚨 [FIRESTORE WRITE DIAGNOSTIC LOG] ${operation}`);
  console.error(`ID Log: ${logId}`);
  console.error(`Thời gian: ${timestamp}`);
  console.error(`Thao tác: ${operation}`);
  console.error(`Mã lỗi (Code): ${errorCode}`);
  console.error(`Tên lỗi (Name): ${errorName}`);
  console.error(`Nội dung lỗi (Message): ${errorMessage}`);
  console.error(`Bối cảnh người dùng:`, logRecord.userContext);
  console.error(`Cảnh báo thiếu trường bắt buộc:`, missingRequiredFields.length > 0 ? missingRequiredFields : 'Không');
  console.error(`Bản đồ cấu trúc Payload:`, structureMap);
  console.error(`Dữ liệu Payload thô:`, payload);
  console.error(`FULL STACK TRACE:\n${errorStack}`);
  console.groupEnd();

  // 5. Construct Toast Notification Message
  const missingNotice = missingRequiredFields.length > 0
    ? `\n⚠️ Dữ liệu thiếu trường: [${missingRequiredFields.join(', ')}]`
    : '';

  const stackLines = errorStack.split('\n').filter(l => l.trim().length > 0);
  const stackSnippet = stackLines.slice(0, 2).join(' ').replace(/\s+/g, ' ');

  const payloadSummaryStr = isArray
    ? `Danh sách ${itemCount} mục | Khóa: [${keysPresent.slice(0, 5).join(', ')}]`
    : `ID: ${payload?.id || 'N/A'} | Cấu trúc (${keysPresent.length} khóa): [${keysPresent.slice(0, 5).join(', ')}]`;

  const toastMessage = `[Lỗi Ghi Firestore] ${operation}: ${errorMessage} (Mã: ${errorCode})${missingNotice}\n📦 Payload: ${payloadSummaryStr}\n📜 Stack: ${stackSnippet}`;

  // 6. Display Toast with Action to copy full Diagnostic Log JSON
  showToastFn(
    toastMessage,
    'error',
    {
      title: `🚨 Diagnostic Log: Thất Bại Ghi Firestore (${operation})`,
      durationMs: 12000,
      actionLabel: 'Sao chép Diagnostic Log',
      onAction: () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(logRecord.fullReportJson)
            .then(() => {
              showToastFn('Đã sao chép toàn bộ Diagnostic Log & Stack Trace vào Clipboard!', 'info', { durationMs: 4000 });
            })
            .catch(() => {
              console.log('Diagnostic JSON:', logRecord.fullReportJson);
              showToastFn('Chi tiết Diagnostic Log đã xuất ra F12 Console.', 'info', { durationMs: 4000 });
            });
        }
      }
    }
  );

  return logRecord;
}

export function getRecentDiagnosticLogs(): DiagnosticLogRecord[] {
  return [...diagnosticLogHistory];
}

export function clearDiagnosticLogs(): void {
  diagnosticLogHistory.length = 0;
}
