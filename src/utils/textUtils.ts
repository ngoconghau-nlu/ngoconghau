/**
 * Utility functions for text normalization, Vietnamese tone stripping,
 * and fuzzy/case-insensitive search.
 */

export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  let result = str;
  result = result.toLowerCase();
  result = result.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  result = result.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  result = result.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  result = result.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  result = result.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  result = result.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  result = result.replace(/đ/g, 'd');
  // Some system encodings use decomposed Unicode characters
  result = result.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ''); // accents
  result = result.replace(/\u02C6|\u0306|\u031B/g, ''); // circumflex, breve, horn
  return result;
}

export function searchMatches(text: string, query: string): boolean {
  if (!query) return true;
  if (!text) return false;

  const rawText = text.toLowerCase();
  const rawQuery = query.toLowerCase().trim();

  // 1. Direct substring match
  if (rawText.includes(rawQuery)) return true;

  // 2. Accent-insensitive Vietnamese match
  const normalizedText = removeVietnameseTones(rawText);
  const normalizedQuery = removeVietnameseTones(rawQuery);

  if (normalizedText.includes(normalizedQuery)) return true;

  // 3. Multi-word search: all words in query match somewhere
  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  if (queryTokens.length > 1) {
    return queryTokens.every(token => normalizedText.includes(token));
  }

  return false;
}
