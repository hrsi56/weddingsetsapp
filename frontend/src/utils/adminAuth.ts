// src/utils/adminAuth.ts
//
// קובץ עזר לניהול טוקן האדמין.
// מופרד מ-App.tsx ומ-AdminScreen.tsx כדי למנוע Circular Import.

const TOKEN_KEY = "admin_token";
const TOKEN_TTL_SECONDS = 12 * 60 * 60; // 12 שעות

export const getAdminToken = (): string | null =>
  sessionStorage.getItem(TOKEN_KEY);

export const saveAdminToken = (token: string): void =>
  sessionStorage.setItem(TOKEN_KEY, token);

export const clearAdminToken = (): void =>
  sessionStorage.removeItem(TOKEN_KEY);

/**
 * בדיקה אופטימיסטית של ה-timestamp בצד הלקוח.
 * אינה מאמתת את ה-HMAC (אין לנו את ה-secret),
 * אבל מונעת שימוש בטוקן שפג תוקפו בצד הלקוח.
 * האימות האמיתי תמיד ייעשה בשרת.
 */
export const isTokenLikelyValid = (): boolean => {
  const token = getAdminToken();
  if (!token) return false;
  try {
    const [tsStr] = token.split(".");
    const elapsed = Math.floor(Date.now() / 1000) - parseInt(tsStr, 10);
    return elapsed >= 0 && elapsed < TOKEN_TTL_SECONDS;
  } catch {
    return false;
  }
};
