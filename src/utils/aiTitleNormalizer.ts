/**
 * Utility function to normalize activity titles using AI (Gemini 3.8 Flash) via server API endpoint
 * with intelligent client-side fallback rule engine for Vietnamese youth organization terms.
 */

export interface NormalizeTitleResponse {
  success: boolean;
  normalizedTitle: string;
  error?: string;
}

const VIETNAMESE_ABBREVIATIONS: Record<string, string> = {
  'MHX': 'Chiến dịch Tình nguyện Mùa Hè Xanh',
  'XTN': 'Chiến dịch Tình nguyện Xuân Tình Nguyện',
  'SHCD': 'Tuần sinh hoạt công dân - sinh viên',
  'ĐRL': 'Điểm rèn luyện',
  'SV5T': 'Phong trào Sinh viên 5 tốt',
  'NCKH': 'Hội nghị Nghiên cứu Khoa học',
  'HMTN': 'Ngày hội Hiến máu Nhân đạo',
  'CLB': 'Câu lạc bộ',
  'ĐV': 'Đoàn viên',
  'SV': 'Sinh viên',
  'BTH': 'Ban Thường vụ',
  'BCH': 'Ban Chấp hành',
  'BT': 'Bí thư',
  'PBT': 'Phó Bí thư',
  'CĐ': 'Chi đoàn',
  'CĐCS': 'Chi đoàn Cơ sở',
};

/**
 * Fallback rule-based normalizer if server/AI endpoint is unavailable
 */
export function fallbackNormalizeTitle(title: string): string {
  if (!title || !title.trim()) return '';
  let normalized = title.trim();

  // Replace common acronyms using safe boundary check without character class range issues
  Object.entries(VIETNAMESE_ABBREVIATIONS).forEach(([abbr, full]) => {
    const regex = new RegExp(`(^|\\s|[.,():;/\\-])` + abbr + `($|\\s|[.,():;/\\-])`, 'gi');
    normalized = normalized.replace(regex, `$1${full}$2`);
  });

  // Capitalize first character
  normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);

  return normalized;
}

/**
 * Normalizes a single activity title by calling server Gemini endpoint
 */
export async function normalizeActivityTitle(
  title: string,
  context?: { category?: string; orgName?: string; type?: string }
): Promise<NormalizeTitleResponse> {
  if (!title || !title.trim()) {
    return { success: false, normalizedTitle: '', error: 'Tên hoạt động rỗng' };
  }

  try {
    const res = await fetch('/api/gemini/normalize-title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), context }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    if (data.success && data.normalizedTitle) {
      return { success: true, normalizedTitle: data.normalizedTitle };
    } else {
      return { success: true, normalizedTitle: data.fallback || fallbackNormalizeTitle(title) };
    }
  } catch (err: any) {
    console.warn('AI Title Normalization API unavailable, using rule fallback:', err);
    return {
      success: true,
      normalizedTitle: fallbackNormalizeTitle(title),
      error: 'Sử dụng quy tắc chuẩn hóa offline'
    };
  }
}

/**
 * Normalizes multiple activity titles in batch
 */
export async function normalizeMultipleTitles(
  titles: string[],
  context?: any
): Promise<string[]> {
  if (!titles || titles.length === 0) return [];

  try {
    const res = await fetch('/api/gemini/normalize-title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titles, context }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
        return data.results;
      }
    }
  } catch (err) {
    console.warn('Batch AI Title Normalization failed, falling back:', err);
  }

  return titles.map(fallbackNormalizeTitle);
}
