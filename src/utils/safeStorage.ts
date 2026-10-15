/**
 * Utility for safely interacting with browser localStorage while handling QuotaExceededError smoothly.
 */

export function safeLocalStorageSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error: any) {
    const isQuotaError =
      error?.name === 'QuotaExceededError' ||
      error?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error?.code === 22 ||
      error?.code === 1014 ||
      (typeof error?.message === 'string' && error.message.includes('exceeded the quota'));

    if (!isQuotaError) {
      console.warn(`localStorage setItem failed for key "${key}":`, error);
      return false;
    }

    console.warn(`[SafeStorage] QuotaExceededError encountered for key "${key}". Attempting automatic recovery/pruning...`);

    // Strategy 1: Truncate current item if it's an array
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.length > 15) {
        const truncated = parsed.slice(0, 15);
        const truncatedVal = JSON.stringify(truncated);
        localStorage.setItem(key, truncatedVal);
        console.info(`[SafeStorage] Saved truncated array (15 items) for key "${key}".`);
        return true;
      }
    } catch {
      // ignore JSON parse error
    }

    // Strategy 2: Prune non-critical cached collections
    const nonCriticalKeys = [
      'nlu_youth_system_logs_v2026',
      'nlu_youth_student_audit_logs_v2026',
      'nlu_youth_score_audit_logs_v2026',
      'nlu_youth_students_backup_snapshot_v2026',
      'nlu_youth_backups_v2026',
      'nlu_youth_system_activity_logs_v2026',
      'nluyouth_retry_queue_v1'
    ];

    for (const pruneKey of nonCriticalKeys) {
      if (pruneKey !== key) {
        try {
          const raw = localStorage.getItem(pruneKey);
          if (raw && raw.length > 500) {
            try {
              const arr = JSON.parse(raw);
              if (Array.isArray(arr) && arr.length > 5) {
                localStorage.setItem(pruneKey, JSON.stringify(arr.slice(0, 5)));
              } else {
                localStorage.removeItem(pruneKey);
              }
            } catch {
              localStorage.removeItem(pruneKey);
            }
          }
        } catch {
          // ignore
        }
      }
    }

    // Strategy 3: Attempt write again
    try {
      localStorage.setItem(key, value);
      console.info(`[SafeStorage] Successfully saved key "${key}" after pruning non-critical caches.`);
      return true;
    } catch {
      // Strategy 4: Try saving minimal slice if value was an array
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed) && parsed.length > 3) {
          localStorage.setItem(key, JSON.stringify(parsed.slice(0, 3)));
          return true;
        }
      } catch {
        // ignore
      }
      console.warn(`[SafeStorage] Storage remains full for key "${key}". Skipping localStorage write gracefully to avoid app crash.`);
      return false;
    }
  }
}

export function safeLocalStorageGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`localStorage getItem failed for key "${key}":`, error);
    return null;
  }
}

const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

/**
 * Debounces writes to localStorage so rapid UI state mutations (typing, filtering, scoring)
 * don't repeatedly block the main JS thread with expensive JSON serialization.
 */
export function debouncedSafeLocalStorageSetItem(
  key: string,
  valueOrProvider: string | (() => string),
  delayMs = 350
): void {
  if (debounceTimers[key]) {
    clearTimeout(debounceTimers[key]);
  }
  debounceTimers[key] = setTimeout(() => {
    delete debounceTimers[key];
    try {
      const val = typeof valueOrProvider === 'function' ? valueOrProvider() : valueOrProvider;
      safeLocalStorageSetItem(key, val);
    } catch (err) {
      console.warn(`[SafeStorage] Debounced write failed for key "${key}":`, err);
    }
  }, delayMs);
}
