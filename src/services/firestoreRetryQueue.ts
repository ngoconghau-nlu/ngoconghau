import {
  saveStudentToFirestore,
  batchSaveStudentsToFirestore,
  saveActivityToFirestore,
  batchSaveActivitiesToFirestore,
  softDeleteActivityInFirestore,
  withRetry
} from './firestoreService';
import { db } from './firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { safeLocalStorageSetItem } from '../utils/safeStorage';

export type QueueOperationType =
  | 'SAVE_STUDENT'
  | 'BATCH_SAVE_STUDENTS'
  | 'SAVE_ACTIVITY'
  | 'BATCH_SAVE_ACTIVITIES'
  | 'SAVE_TARGET'
  | 'SAVE_ACCOUNT'
  | 'SAVE_CERTIFICATE'
  | 'GENERIC_DOC_SET'
  | 'GENERIC_DOC_DELETE';

export interface RetryQueueItem {
  id: string;
  type: QueueOperationType;
  description: string;
  collectionName?: string;
  docId?: string;
  payload: any;
  createdAt: string;
  updatedAt: string;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'success' | 'failed';
  lastError?: string;
}

export interface RetryQueueStats {
  total: number;
  pending: number;
  processing: number;
  success: number;
  failed: number;
  isOnline: boolean;
  isProcessing: boolean;
  isQuotaExceeded?: boolean;
  quotaErrorMessage?: string;
  lastProcessedAt?: string;
}

const STORAGE_KEY = 'nlu_firestore_retry_queue_v1';
type QueueListener = (stats: RetryQueueStats, items: RetryQueueItem[]) => void;

class FirestoreRetryQueueService {
  private queue: RetryQueueItem[] = [];
  private listeners: Set<QueueListener> = new Set();
  private isProcessing = false;
  private isQuotaExceeded = false;
  private quotaErrorMessage?: string;
  private lastProcessedAt?: string;

  constructor() {
    this.loadFromStorage();
    // Auto process on startup if online and pending items exist
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.info('[RetryQueue] Network restored. Auto processing pending write queue...');
        this.processQueue();
      });
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Reset any stuck 'processing' items back to 'pending'
          this.queue = parsed.map((item: RetryQueueItem) => ({
            ...item,
            status: item.status === 'processing' ? 'pending' : item.status
          }));
        }
      }
    } catch (err) {
      console.warn('[RetryQueue] Could not load retry queue from localStorage:', err);
      this.queue = [];
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      // Only keep pending, failed, or recent items to keep storage lean
      const itemsToStore = this.queue.slice(-50);
      safeLocalStorageSetItem(STORAGE_KEY, JSON.stringify(itemsToStore));
    } catch (err) {
      console.warn('[RetryQueue] Could not save retry queue to localStorage:', err);
    }
    this.notifyListeners();
  }

  public getItems(): RetryQueueItem[] {
    return [...this.queue];
  }

  public getStats(): RetryQueueStats {
    const pending = this.queue.filter(i => i.status === 'pending').length;
    const processing = this.queue.filter(i => i.status === 'processing').length;
    const success = this.queue.filter(i => i.status === 'success').length;
    const failed = this.queue.filter(i => i.status === 'failed').length;

    return {
      total: this.queue.length,
      pending,
      processing,
      success,
      failed,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isProcessing: this.isProcessing,
      isQuotaExceeded: this.isQuotaExceeded,
      quotaErrorMessage: this.quotaErrorMessage,
      lastProcessedAt: this.lastProcessedAt
    };
  }

  public subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    // Initial call
    listener(this.getStats(), this.getItems());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const stats = this.getStats();
    const items = this.getItems();
    this.listeners.forEach(fn => fn(stats, items));
  }

  /**
   * Enqueues a Firestore write action to retry later when offline or transient error occurs.
   */
  public enqueue(
    type: QueueOperationType,
    description: string,
    payload: any,
    options?: { collectionName?: string; docId?: string; maxRetries?: number }
  ): RetryQueueItem {
    const id = `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newItem: RetryQueueItem = {
      id,
      type,
      description,
      collectionName: options?.collectionName,
      docId: options?.docId,
      payload,
      createdAt: now,
      updatedAt: now,
      retryCount: 0,
      maxRetries: options?.maxRetries || 5,
      status: 'pending'
    };

    // Deduping: If exact same doc/student write is already pending, replace its payload
    if (options?.docId && options?.collectionName) {
      const existingIdx = this.queue.findIndex(
        i => i.status === 'pending' && i.collectionName === options.collectionName && i.docId === options.docId
      );
      if (existingIdx >= 0) {
        this.queue[existingIdx] = {
          ...this.queue[existingIdx],
          payload,
          description,
          updatedAt: now
        };
        this.saveToStorage();
        if (navigator.onLine) {
          this.processQueue();
        }
        return this.queue[existingIdx];
      }
    }

    this.queue.push(newItem);
    this.saveToStorage();

    console.info(`[RetryQueue] Added new item to retry queue: "${description}" (${id})`);

    // Attempt processing immediately if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.processQueue();
    }

    return newItem;
  }

  /**
   * Remove a specific item from the queue
   */
  public removeItem(id: string): void {
    this.queue = this.queue.filter(i => i.id !== id);
    this.saveToStorage();
  }

  /**
   * Clear all completed or failed items
   */
  public clearCompleted(): void {
    this.queue = this.queue.filter(i => i.status === 'pending' || i.status === 'processing');
    this.saveToStorage();
  }

  /**
   * Reset failed items back to 'pending' to retry them
   */
  public retryFailed(): void {
    this.queue = this.queue.map(item => {
      if (item.status === 'failed') {
        return {
          ...item,
          status: 'pending',
          retryCount: 0,
          lastError: undefined,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });
    this.saveToStorage();
    this.processQueue();
  }

  public setQuotaExceeded(exceeded: boolean, message?: string): void {
    this.isQuotaExceeded = exceeded;
    if (exceeded && message) {
      this.quotaErrorMessage = message;
    }
    this.notifyListeners();
  }

  /**
   * Process all pending write items sequentially
   */
  public async processQueue(): Promise<{ processedCount: number; successCount: number; failedCount: number }> {
    if (this.isProcessing) {
      return { processedCount: 0, successCount: 0, failedCount: 0 };
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.info('[RetryQueue] Device is offline. Waiting for network connection before flushing retry queue.');
      return { processedCount: 0, successCount: 0, failedCount: 0 };
    }

    const pendingItems = this.queue.filter(i => i.status === 'pending');
    if (pendingItems.length === 0) {
      return { processedCount: 0, successCount: 0, failedCount: 0 };
    }

    this.isProcessing = true;
    this.isQuotaExceeded = false;
    this.quotaErrorMessage = undefined;
    this.notifyListeners();

    let successCount = 0;
    let failedCount = 0;

    console.group(`[RetryQueue] Starting processing ${pendingItems.length} queued Firestore write items...`);

    for (const item of pendingItems) {
      // Re-check online state
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        console.warn('[RetryQueue] Connection dropped mid-queue processing.');
        break;
      }

      item.status = 'processing';
      item.updatedAt = new Date().toISOString();
      this.notifyListeners();

      try {
        await this.executeItemOperation(item);
        item.status = 'success';
        item.updatedAt = new Date().toISOString();
        successCount++;
        console.log(`[RetryQueue ✅] Successfully synced queued write: "${item.description}"`);
      } catch (err: any) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const errCode = (err && typeof err === 'object' && 'code' in err) ? String(err.code) : '';
        const isQuotaExceeded =
          errCode === 'resource-exhausted' ||
          errMsg.includes('resource-exhausted') ||
          errMsg.includes('Quota limit exceeded') ||
          errMsg.includes('Quota exceeded') ||
          errMsg.includes('Hệ thống vượt quá hạn mức') ||
          errMsg.includes('Free daily write units');

        if (isQuotaExceeded) {
          this.isQuotaExceeded = true;
          this.quotaErrorMessage = 'Cơ sở dữ liệu đạt hạn mức truy vấn Google Cloud miễn phí trong ngày (Daily Quota Exceeded). Dữ liệu được bảo toàn an toàn 100% ở LocalStorage.';
          item.status = 'pending';
          item.lastError = this.quotaErrorMessage;
          item.updatedAt = new Date().toISOString();
          this.saveToStorage();
          console.warn(`[RetryQueue 🛑] Quota limit reached for Firestore. Pausing auto-sync loop to avoid backend backoff.`);
          break;
        }

        item.retryCount += 1;
        item.lastError = errMsg;
        item.updatedAt = new Date().toISOString();

        if (item.retryCount >= item.maxRetries) {
          item.status = 'failed';
          failedCount++;
          console.error(`[RetryQueue ❌] Item reached max retries (${item.maxRetries}): "${item.description}". Error: ${errMsg}`);
        } else {
          item.status = 'pending'; // Put back for next attempt
          console.warn(`[RetryQueue ⚠️] Attempt ${item.retryCount}/${item.maxRetries} failed for "${item.description}". Will retry. Error: ${errMsg}`);
        }
      }

      this.saveToStorage();
    }

    this.isProcessing = false;
    this.lastProcessedAt = new Date().toISOString();
    console.groupEnd();

    // Auto cleanup success items after 1 minute
    setTimeout(() => {
      this.queue = this.queue.filter(i => i.status !== 'success');
      this.saveToStorage();
    }, 60000);

    this.notifyListeners();

    return {
      processedCount: pendingItems.length,
      successCount,
      failedCount
    };
  }

  private async executeItemOperation(item: RetryQueueItem): Promise<void> {
    const { type, payload, collectionName, docId } = item;

    switch (type) {
      case 'SAVE_STUDENT':
        await saveStudentToFirestore(payload);
        break;

      case 'BATCH_SAVE_STUDENTS':
        await batchSaveStudentsToFirestore(payload);
        break;

      case 'SAVE_ACTIVITY':
        await saveActivityToFirestore(payload);
        break;

      case 'BATCH_SAVE_ACTIVITIES':
        await batchSaveActivitiesToFirestore(payload);
        break;

      case 'SAVE_TARGET':
      case 'SAVE_ACCOUNT':
      case 'SAVE_CERTIFICATE':
      case 'GENERIC_DOC_SET': {
        const targetCol = collectionName || (type === 'SAVE_TARGET' ? 'targets' : type === 'SAVE_ACCOUNT' ? 'systemAccounts' : 'issuedCertificates');
        const targetId = docId || payload.id || payload.studentId || payload.email;
        if (!targetId) throw new Error('Missing document ID for doc set operation.');
        const docRef = doc(db, targetCol, String(targetId));
        await withRetry(() => setDoc(docRef, JSON.parse(JSON.stringify(payload)), { merge: true }));
        break;
      }

      case 'GENERIC_DOC_DELETE': {
        if (!collectionName || !docId) throw new Error('Missing collectionName or docId for delete operation.');
        const docRef = doc(db, collectionName, String(docId));
        await withRetry(() => deleteDoc(docRef));
        break;
      }

      default:
        throw new Error(`Unsupported queue operation type: ${type}`);
    }
  }
}

export const firestoreRetryQueue = new FirestoreRetryQueueService();
